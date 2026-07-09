import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import Drawflow, { DrawflowNode } from 'drawflow';
import { APIDrawflowNode, APINodeMapping, APISelectedResponse, APISourceExport, DrawFlowProperties } from '../core/models/APISource/drawFlow';
import { HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BusyService } from '../core/services/busy.service';
import { ToastrService } from 'ngx-toastr';
import { After } from 'v8';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiRequestError, ApiSourceService } from '../core/services/APISource/apisource.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdditionalSettings } from '../core/models/additionalSettings';
import { FileType } from '../shared/enum';
import { NavigateService } from '../core/services/navigate.service';

@Component({
  selector: 'app-api-source-upload',
  standalone: false,
  templateUrl: './api-source-upload.component.html',
  styleUrl: './api-source-upload.component.css',
})
export class ApiSourceUploadComponent implements AfterViewInit, OnInit {

  editor!: Drawflow;
  nodeProperties: DrawFlowProperties[] = [];
  private _currentNodeSelected: DrawflowNode | undefined = undefined;
  selectedNodeProperties?: DrawFlowProperties;
  height = 150;
  nodeCount = 0;
  private initialized = false;
  activeBodyName: string = 'none-body';
  nodes: any;
  activeTab = 'params';
  readonly defaultNodePropertyWidth = 500;
  nodePropertyWidth = this.defaultNodePropertyWidth;
  nodeResponses: APISelectedResponse[] = [{ nodeId: 0, nodeName: '', key: '', value: '' }];
  toggleMap: { [key: string]: boolean } = {};
  newNodeName: string = '';
  authTypes = ['No Auth', 'Bearer Token', 'Basic Auth'];
  dataSource: number = 1;
  //#region Process Configuration Component
  modifySettings = false;
  config: AdditionalSettings;
  selectedNodeMappings: APINodeMapping[] = [];

  onNodeMappingsChange(mappings: APINodeMapping[]): void {
    this.selectedNodeMappings = mappings;
  }

  get selectedNodeNames(): string[] {
    return [...new Set(this.selectedNodeMappings.map(m => m.nodeName))];
  }
  fileUploadForm: FormGroup = new FormGroup({});
  get clientInfoForm(): FormGroup {
    return this.fileUploadForm.get('clientInfo') as FormGroup;
  }

  get allNodes(): APIDrawflowNode[] {
    const data = this.editor?.drawflow?.drawflow?.['Home']?.data;
    return data ? Object.values(data) as APIDrawflowNode[] : [];
  }
  //#endregion Process Configuration Component

  private isResizing = false;
  private isResizingNodePropertyWidth = false;
  private readonly minPanelHeight = 120;
  private readonly minNodePropertyWidth = 320;
  private readonly nodePropertyRightPadding = 120;

  @ViewChild('drawflowContainer', { static: true }) container!: ElementRef;
  @ViewChild('panelContainer', { static: true }) panelContainer!: ElementRef<HTMLElement>;
  @ViewChild('apiSourcePageRef', { static: true }) apiSourcePageRef!: ElementRef<HTMLElement>;
  @ViewChild('modalYesNo') renameModal: any;

  get currentNodeSelected(): DrawflowNode | undefined {
    return this._currentNodeSelected;
  }

  set currentNodeSelected(value: DrawflowNode | undefined) {
    this._currentNodeSelected = value;
    if (value === undefined) {
      this.resetNodePropertyWidth();
    } else {
      this.modifySettings = false;
      this.resetNodePropertyWidth();
    }
  }

  constructor(
    private fb: FormBuilder,
    private apiUploadService: ApiSourceService,
    private modalService: NgbModal,
    private toastrService: ToastrService,
    private busyService: BusyService,
    private navigateService: NavigateService) { }

  ngOnInit(): void {
    this.dataSource = this.navigateService.dataSource;
    this.initializeForm();

    this.config = this.resetAdditionalSettings();
  }

  ngAfterViewInit(): void {
    const cont = document.getElementById('drawflowContainer');
    if (!this.initialized && this.container?.nativeElement) {
      requestAnimationFrame(() => {
        this.editor = new Drawflow(this.container.nativeElement);
        this.editor.start();
        this.initialized = true;
        this.editor.on('nodeRemoved', (id) => {
          console.log("Node removed " + id);
          if (this.currentNodeSelected) {
            this.nodeProperties.splice(+id - 1, 1);
            --this.nodeCount;
            this.currentNodeSelected = undefined;
          }
        });

        this.container.nativeElement.addEventListener('dblclick', (event: MouseEvent) => {
          const nodeElement = (event.target as HTMLElement).closest('.drawflow-node');
          if (nodeElement) {
            let nodeId = parseInt(nodeElement.id.replace('node-', ''));
            const currentName = this.nodes[+nodeId].name;
            if (currentName.toLowerCase() !== 'authentication') {
              this.newNodeName = currentName;
              this.modalService.open(this.renameModal);
            }
          }
        })

        this.container.nativeElement.addEventListener('click', (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          this.currentNodeSelected = undefined;
          // Open panel when the settings link inside a node is clicked
          const settingsLink = target.closest('.node-settings-link') as HTMLElement;
          if (settingsLink) {
            event.stopPropagation();
            const nodeEl = settingsLink.closest('.drawflow-node') as HTMLElement;
            if (nodeEl) {
              const nodeId = parseInt(nodeEl.id.replace('node-', ''));
              this.nodes = this.editor.drawflow.drawflow['Home'].data;
              this.currentNodeSelected = this.nodes[nodeId];
              this.selectedNodeProperties = this.nodeProperties.find(x => x.name === this.currentNodeSelected.name);
              this.retrieveValues(nodeId);
              this.onTabChange('params');
              this.isNodeConnected();
            }
            return;
          }

          // Close panel when clicking outside any node
          if (target.closest('.drawflow-node') === null) {
            this.currentNodeSelected = undefined;
            this.onTabChange('params');
          }
        });



        this.container.nativeElement.addEventListener('drop', (event: DragEvent) => {
          event.preventDefault();
          if (!this.initialized || !this.editor) {
            return;
          }
          const nodeType = (event.dataTransfer?.getData('node')
            || event.dataTransfer?.getData('text/plain')
            || event.dataTransfer?.getData('text')
            || '').trim();
          const containerRect = this.container.nativeElement.getBoundingClientRect();
          const posX = (event.clientX - containerRect.left - this.editor.canvas_x) / this.editor.zoom;
          const posY = (event.clientY - containerRect.top - this.editor.canvas_y) / this.editor.zoom;
          if (!this.isNameUnique(nodeType) && nodeType === 'Authentication') {
            this.toastrService.warning('Unable to add two Authentication');
            return;
          }
          if (nodeType) {

            this.editor.addNode(nodeType, 1, 1, posX, posY, nodeType, { label: `${nodeType}` }, this.buildNodeHtml(nodeType), false);

            this.nodeProperties.push({
              id: this.nodeProperties.length + 1,
              name: nodeType,
              httpMethod: 'POST',
              stringURL: '',
              nodeParams: [{ willInclude: true, key: '', value: '', description: '' }],
              //headers: [{ willInclude: true, key: '', value: '', description: '' }],
              headers: [
                //delete after testing
                { willInclude: true, key: 'userid', value: 'quijano.61', description: '', prefix: '' },
                { willInclude: true, key: 'clientid', value: 'ccfd7bb2-5cf2-41d8-8921-30b66ca76c0e', description: '', prefix: '' },
                { willInclude: true, key: 'clientsecret', value: 'FNUIvhwKyBxhoVac4IdVmqLn1ln6TtZJcakUXcepKA0/9Mqbg5g4fBmZGuu7++/RUbHEahmGPpu6De+SE1/2kozbgV9ZmwS2Z+ofej0X3bEDIOxE0aB4vhdizKbOyhOTb/DBp6uROQHPm0FqlTKOfA==', description: '', prefix: '' },
                { willInclude: true, key: 'x-tpds-api-version', value: '1.0', description: '', prefix: '' },

              ],
              body: {
                formData: [{ willInclude: true, key: '', value: '', description: '' }],
                xWWWFormUrlEncoded: [{ willInclude: true, key: '', value: '', description: '' }],
                raw: ''
              },
              response: '',
              responseTime: 0,
              responseStatus: '',
              authorization: {
                authType: 'No auth',
                bearerToken: '',
                userName: '',
                password: ''
              },
              selectedResponses: [],
              showResponses: false
            });


          }
        });



        this.container.nativeElement.addEventListener('dragover', (event: DragEvent) => {
          event.preventDefault();
        });

      })



    } else {
      console.error('draw flow container not found');
    }


    //editor.addNode('example',1,1,100,100, 'example-node', {}, '<div>Example Node</div>', "html");




    // this.editor.on('connectionCreated', () => {
    //   this.addArrowheads();
    // });
  }

  initializeForm() {


    this.fileUploadForm = this.fb.group({
      clientInfo: this.fb.group({
        RegionId: ['', Validators.required],
        SubRegionId: ['', Validators.required],
        ClientId: ['', Validators.required],
        processName: ['', Validators.required],
        description: ['', Validators.required],
        security_group: [[], Validators.required]
      }),
      formFile: [{ value: '', disabled: true }, Validators.required],
      configuration: [null, Validators.required],
    });


  }

  resetAdditionalSettings(): AdditionalSettings {
    return {
      flpConfigurationId: '',
      processName: '',
      description: '',
      delimiter: ',', //TODO: to autodetect remove ,
      key_columns: '',
      flexCheckHasHeaders: true,
      flexCheckSkipEmptyLines: true, //todo not yet saved
      flexCheckEscapeCharacter: '"', //todo not yet saved
      txtQuoteCharacter: '"',
      txtEscapeCharacter: '"', //todo not yet saved
      txtEncoding: 'UTF-8',
      flexCheckOrderByColumnListForDedup: false,
      order_by_column_list_name: '',
      order_by_column_list_name_sort_dir: 'desc',
      is_active: true,
      do_not_archive_file: false,
      spanish_to_english: false,
      roman_numerals_only: false,
      ignore_duplicate_rows: false,
      csv_column_name_list: '',
      keep_first_row: false,
      tableName: '',// this.fileName,
      databaseName: '', //todo: get assigned default database for user
      validate_fileschema: false,
      drop_history_table: false,
      drop_main_table: false,
      order_by_column_list_for_dedup: '',
      RegionId: '', //todo: get assigned default region
      SubRegionId: '', //todo: get assigned default subregion
      ClientId: '', //todo: get assigned default clientname
      databaseNames: [],
      databaseNameId: 0,
      fileType: FileType.CommaSeparatedValues, //default,
      databaseConfigurationId: '',
      convert_datatypes_column_list: '',
      column_name_list: '',
      skip_footer_rows: 0,
      skip_header_rows: 0,
      sender_communication_email: sessionStorage.getItem('emailID'),
      region: '',
      subRegion: '',
      clientName: '',
      file_column_mapping: [],
      mergeData: false,
      createHistoryTable: false,
      deltaJobId: '',
      deltaTableName: '',
      deltaServerNameId: 0,
      deltaStorageAccountId: '',
      deltaContainerName: '',
      deltaSource: '',
      sourcePath: '',
      dataSource: this.dataSource,
      securityGroups: [],
      frmSubmitted: false,
      ignoreSheet: false, //default value for ignoreSheet 
      newSheet: false, //default value for newSheet
      missingSheet: false,
      ruleSet: [],
      ruleSetNameId: null,
      ruleSetName: '',
      ruleType: '',
      subRuleType: '',
      patternType: '',
      ruleColumnName: '',
      isCombinationRule: false,
      requiredRuleDescription: '',
      uniqueRuleDescription: '',
      formatType: '',
      valueType: '',
      conditionType: '',
      aiPrompt: '',
      fromValue: 0,
      toValue: 0,
      spName: '',
      campaignId: '',
      internalCampaignId: '',

      //landing layer form values
      landingLayerFileExtension: [],
      landingLayerRegex: [],
      landingLayerPrefix: '',
      landingLayerDateformat: 0,
      landingLayerTimeformat: 0,
      landingLayerAcceptedPath: '',
      landingLayerRejectedPath: '',

      //DisplayNamesOnly
      databaseNameDisplayName: '',
      deltaStorageAccountIdDisplayName: '',
    }
  }

  private buildNodeHtml(label: string): string {
    return `<div class="node-inner">
      <span class="node-label">${label}</span>
      <span class="node-settings-link" title="Click here to show the property window">
        <span class="material-icons-round" style="font-size:16px;vertical-align:middle;">tune</span>
      </span>
    </div>`;
  }

  drag(event: DragEvent) {
    const sourceEl = (event.currentTarget as HTMLElement)
      || (event.target as HTMLElement)?.closest('.drag-drawflow') as HTMLElement;
    const nodeType = sourceEl?.getAttribute('data-node');
    if (event.dataTransfer && nodeType) {
      event.dataTransfer.setData('node', nodeType);
      event.dataTransfer.setData('text/plain', nodeType);
      event.dataTransfer.setData('text', nodeType);
      event.dataTransfer.effectAllowed = 'copyMove';
      event.dataTransfer.dropEffect = 'move';
    }
  }

  startResizing(event: MouseEvent) {
    this.isResizing = true;
    event.preventDefault();
  }

  startResizingNodePropertyWidth(event: MouseEvent) {
    this.isResizingNodePropertyWidth = true;
    event.preventDefault();
  }

  resetNodePropertyWidth() {
    const viewportHalf = Math.round(window.innerWidth * 0.5);
    if (!this.apiSourcePageRef?.nativeElement) {
      this.nodePropertyWidth = Math.max(this.minNodePropertyWidth, viewportHalf || this.defaultNodePropertyWidth);
      return;
    }

    const rect = this.apiSourcePageRef.nativeElement.getBoundingClientRect();
    const maxWidth = Math.max(this.minNodePropertyWidth, rect.width - this.nodePropertyRightPadding);
    this.nodePropertyWidth = Math.max(this.minNodePropertyWidth, Math.min(maxWidth, viewportHalf));
  }

  @HostListener('document:mousemove', ['$event'])
  onResizePanel(event: MouseEvent) {
    if (this.isResizingNodePropertyWidth && this.apiSourcePageRef?.nativeElement) {
      const rect = this.apiSourcePageRef.nativeElement.getBoundingClientRect();
      const maxWidth = Math.max(this.minNodePropertyWidth, rect.width - this.nodePropertyRightPadding);
      const nextWidth = rect.right - event.clientX;
      this.nodePropertyWidth = Math.round(Math.max(this.minNodePropertyWidth, Math.min(maxWidth, nextWidth)));
      return;
    }

    if (!this.isResizing || !this.panelContainer?.nativeElement) {
      return;
    }

    const rect = this.panelContainer.nativeElement.getBoundingClientRect();
    const maxHeight = Math.max(this.minPanelHeight, rect.height);
    const nextHeight = rect.bottom - event.clientY;
    this.height = Math.round(Math.max(this.minPanelHeight, Math.min(maxHeight, nextHeight)));
  }

  @HostListener('document:mouseup')
  stopResizing() {
    this.isResizing = false;
    this.isResizingNodePropertyWidth = false;
  }

  onAddModules(): void {
    this.modifySettings = false;
    if (!this.initialized || !this.editor) {
      this.toastrService.warning('Drawflow is still initializing. Please try again in a moment.');
      return;
    }

    const id = this.nodeProperties.length + 1;

    // Calculate position: right of last node, wrap to next row if needed
    const nodeWidth = 160;
    const nodeHeight = 60;
    const padding = 20;
    const canvasWidth = this.container.nativeElement.clientWidth || 800;

    const existingNodes = Object.values(this.editor.drawflow.drawflow['Home'].data) as any[];
    let posX = padding;
    let posY = padding;

    if (existingNodes.length > 0) {
      const last = existingNodes[existingNodes.length - 1];
      const nextX = last.pos_x + nodeWidth + padding;
      if (nextX + nodeWidth > canvasWidth) {
        // wrap to next row: find max Y among all nodes and go below
        const maxY = Math.max(...existingNodes.map(n => n.pos_y));
        posX = padding;
        posY = maxY + nodeHeight + padding;
      } else {
        posX = nextX;
        posY = last.pos_y;
      }
    }

    this.editor.addNode(
      `Module ${id}`,
      1,
      1,
      posX,
      posY,
      'module-node',
      {
        label: `Module ${id}`
      },
      this.buildNodeHtml(`Module ${id}`),
      false

    );

    this.nodeProperties.push({
      id: +id,
      name: `Module ${id}`,
      httpMethod: 'POST',
      stringURL: '',
      nodeParams: [{ willInclude: true, key: '', value: '', description: '' }],
      headers: [{ willInclude: true, key: '', value: '', description: '', prefix: '' }],
      body: {
        formData: [{ willInclude: true, key: '', value: '', description: '' }],
        xWWWFormUrlEncoded: [{ willInclude: true, key: '', value: '', description: '' }],
        raw: ''
      },
      response: '',
      responseTime: 0,
      responseStatus: '',
      authorization: {
        authType: 'No Auth',
        bearerToken: '',
        userName: '',
        password: ''
      },
      selectedResponses: [],
      showResponses: false
    });
  }

  onAuthTypeChange(event: Event) {

    let selectedAuthType = (event.target as HTMLSelectElement).value;

    switch (selectedAuthType.toLowerCase()) {
      case 'bearer token':
        break;
      case 'basic auth':
        break;
      default:
        break;
    }
  }

  onInputBodyChange(rowType: string, id: number, event: any, input: string) {
    let rows = rowType === 'formData' ? this.selectedNodeProperties.body.formData : this.selectedNodeProperties.body.xWWWFormUrlEncoded;
    // this.nodeProperties[this.currentNodeSelected.id - 1].body.formData : this.nodeProperties[this.currentNodeSelected.id - 1].body.xWWWFormUrlEncoded;
    const currentRow = rows[id];
    const isLastRow = id === rows.length - 1;
    var module: any;
    //currentRow[input] = event;
    if (isLastRow && currentRow.key && currentRow.value) {
      if (rowType === "formData") {
        module = this.nodeProperties.find(x => x.id === this.currentNodeSelected.id);
        module.body.formData.push({ willInclude: true, key: '', value: '', description: '' });
      }
      else {
        module = this.nodeProperties.find(x => x.id === this.currentNodeSelected.id);
        module.body.xWWWFormUrlEncoded.push({ willInclude: true, key: '', value: '', description: '' });
      }
    }
  }

  onPasteRaw(event: any) {

  }

  onSelectedResponse(event: any, keyPath: string, data: any) {
    //console.log(data);
    if (event.target.checked) {
      this.selectedNodeProperties.selectedResponses.push({ nodeId: this.currentNodeSelected.id, key: keyPath, value: data, nodeName: this.selectedNodeProperties.name });
      this.nodeResponses = this.selectedNodeProperties.selectedResponses;
    } else {
      this.selectedNodeProperties.selectedResponses = this.selectedNodeProperties.selectedResponses.filter(r => r.key != keyPath);

      this.nodeResponses = this.nodeResponses.filter(r => r.nodeId != this.currentNodeSelected.id);
    }
  }

  onFormatJsonInput() {
    try {
      const parsed = JSON.parse(this.selectedNodeProperties.body.raw);
      this.selectedNodeProperties.body.raw = JSON.stringify(parsed, null, 2); //with indention
    } catch {

    }
  }
  onBodyTypeChange(selectedBodyName: string) {
    this.activeBodyName = selectedBodyName;
  }

  onSelect(param: string, event: any, rowIndex?: number) {
    if (param !== 'headers' || rowIndex === undefined || !this.selectedNodeProperties) {
      return;
    }

    const currentHeader = this.selectedNodeProperties.headers[rowIndex];
    if (!currentHeader) {
      return;
    }

    const prefix = (currentHeader.prefix || '').toString();
    const selectedKey = (event?.key || event || '').toString();

    const matchedResponse = this.nodeResponses.find(r => r.key === selectedKey);
    const selectedValue = (event?.value ?? matchedResponse?.value ?? selectedKey ?? '').toString().trim();

    if (!selectedKey) {
      // When no response key is selected, use prefix as the value.
      currentHeader.value = prefix;
      this.appendEmptyRowIfNeeded('headers', rowIndex);
      return;
    }

    currentHeader.responseKey = selectedKey;
    currentHeader.responseValue = selectedValue;
    currentHeader.value = prefix ? `${prefix}${selectedValue}` : selectedValue;
    this.appendEmptyRowIfNeeded('headers', rowIndex);
  }

  onShowPassword(ctrlName: string, event: any) {
    const passwordInput = document.getElementById(ctrlName) as HTMLInputElement;
    if (passwordInput) {
      let type = passwordInput.type === "password";
      passwordInput.type = type ? "text" : "password";
      event.target.innerHtml = type ? "visibility" : "visibility_off";
    }
  }

  onInputChange(rowType: string, id: number, event: any, input: string) {
    if (rowType !== 'params' && rowType !== 'headers') {
      return;
    }

    this.appendEmptyRowIfNeeded(rowType, id);
  }

  private appendEmptyRowIfNeeded(rowType: 'params' | 'headers', rowIndex: number): void {
    if (!this.selectedNodeProperties) {
      return;
    }

    const rows = rowType === 'params' ? this.selectedNodeProperties.nodeParams : this.selectedNodeProperties.headers;
    const currentRow = rows[rowIndex];

    if (!currentRow || rowIndex !== rows.length - 1) {
      return;
    }

    const hasKey = (currentRow.key || '').toString().trim().length > 0;
    const hasValue = (currentRow.value || '').toString().trim().length > 0;

    if (!hasKey || !hasValue) {
      return;
    }

    rows.push({
      willInclude: true,
      key: '',
      value: '',
      description: '',
      ...(rowType === 'headers' ? { prefix: '', responseKey: '', responseValue: '' } : {})
    });
  }

  onTabChange(tabName: string) {
    this.activeTab = tabName;


    switch (tabName) {
      case "response":
        this.selectedNodeProperties.selectedResponses.forEach(i => {
          const chkecbox = document.getElementById('')
        });

        for (let i = 0; i < this.selectedNodeProperties.selectedResponses.length; i++) {
          const currentResponse = this.selectedNodeProperties.selectedResponses[i];
          const chkeckbox = document.getElementById(`chk${currentResponse.key}`) as HTMLInputElement;
          chkeckbox.checked = this.selectedNodeProperties.selectedResponses.findIndex(x => x.key === currentResponse.key) >= 0 ? true : false;
        }
        break;
    }
  }

  onMethodChange(event: Event) {
    let selectedMethodVallue = (event.target as HTMLSelectElement).value;

    //let currentNode =  [this.currentNodeSelected.id - 1];
    this.selectedNodeProperties.httpMethod = selectedMethodVallue;
    //currentNode.httpMethod = selectedMethodVallue;
  }

  onURLChange(event: any) {
    if (this.currentNodeSelected !== undefined) {
      let param = this.nodeProperties.find(x => x.id === this.currentNodeSelected?.id);
      if (param) param.stringURL = event.target.value;
    }
  }

  onSelectedNodeSend() {
    let httpHeaders = new HttpHeaders();
    const currentNode = this.selectedNodeProperties;//this.nodeProperties[this.currentNodeSelected.id - 1];
    const requestUrl = (currentNode?.stringURL || '').trim();

    if (!requestUrl) {
      currentNode.response = { message: 'URL is required.', status: 0, url: '', error: null };
      this.selectedNodeProperties.responseStatus = 0;
      this.onTabChange('response');
      return;
    }

    // Validate URL early so malformed URLs do not reach HttpClient.
    try {
      const parsed = new URL(requestUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        currentNode.response = { message: 'URL must start with http:// or https://', status: 0, url: requestUrl, error: null };
        this.selectedNodeProperties.responseStatus = 0;
        this.onTabChange('response');
        return;
      }
    } catch {
      currentNode.response = { message: 'Invalid URL format. Please enter a valid endpoint URL.', status: 0, url: requestUrl, error: null };
      this.selectedNodeProperties.responseStatus = 0;
      this.onTabChange('response');
      return;
    }

    currentNode.response = '';
    this.selectedNodeProperties.responseStatus = '';

    //prepare query params
    let httpParams = new HttpParams();
    currentNode.nodeParams.forEach(p => {
      if (p.key && p.value && p.willInclude) {
        httpParams = httpParams.set(p.key, p.value);
      }
    });

    //prepare the authorization
    if (currentNode.authorization) {
      switch (currentNode.authorization.authType) {
        case "Bearer Token":
          if (this.selectedNodeProperties.authorization.bearerToken.trim().length != 0) {
            httpHeaders = httpHeaders.append('Authorization', `Bearer ${this.selectedNodeProperties.authorization.bearerToken.trim()}`);
          }
          break;
        case "Basic Auth":
          httpHeaders = httpHeaders.append('Authorization', 'Basic ' + btoa(`${this.selectedNodeProperties.authorization.userName.trim()}:${this.selectedNodeProperties.authorization.userName.trim()}`));
          break;
      }
    }


    //prepare the headers
    currentNode.headers.forEach((h) => {
      if (h.key && h.value && h.willInclude) {
        httpHeaders = httpHeaders.set(h.key, h.value);
      }
    });


    //prepare body
    let contentType: 'json' | 'form-data' | 'x-www-form-urlencoded';
    let body: any[] = [];
    if (currentNode.body) {

      if (this.activeBodyName === 'x-www-form-urlencoded') {
        this.selectedNodeProperties.body.xWWWFormUrlEncoded.forEach(e => {
          if (e.willInclude) {
            body.push({ key: e.key, val: e.value })
          }
        });

        if (body.length > 0) {
          httpHeaders = httpHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
        }
      } else if (this.activeBodyName === 'raw') {
        //need to test
        body = JSON.parse(this.selectedNodeProperties.body.raw);
        httpHeaders = httpHeaders.set('Content-Type', 'text/plain');
      } else if (this.activeBodyName === 'form-data') {
        httpHeaders = httpHeaders.delete('Content-Type'); //let angular set it
      }
    }


    this.busyService.busy();
    const startTime = performance.now();
    this.apiUploadService.request(currentNode.httpMethod, requestUrl, body, httpHeaders, httpParams, startTime, contentType).subscribe({
      next: (response) => {
        //console.log(response.status);
        this.selectedNodeProperties.responseStatus = response.status;
        this.selectedNodeProperties.responseTime = performance.now() - startTime;
        currentNode.response = JSON.parse(JSON.stringify(response.body));
        this.busyService.idle();
      },
      error: (err: ApiRequestError) => {
        this.selectedNodeProperties.responseStatus = err.status;
        this.selectedNodeProperties.responseTime = performance.now() - startTime;

        currentNode.response = {
          message: err.message,
          status: err.status,
          url: err.url,
          error: err.raw
        };

        this.onTabChange('response');
        this.busyService.idle();
      }
    });
  }

  toggleNode(key: string): void {
    this.toggleMap[key] = !this.toggleMap[key];
  }

  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  getKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  getValueByPath(obj: any, path: string) {
    return obj[path];
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  onConfirmRename(modal: any) {
    if (this.currentNodeSelected !== null) {
      if (!this.isNameUnique(this.newNodeName)) {
        this.toastrService.warning('Name must be unique');
        return;
      }
      this.currentNodeSelected.name = this.newNodeName;
      const nodeElement = document.querySelector(`#node-${this.currentNodeSelected.id} .drawflow_content_node`);
      if (nodeElement) {
        //if(this.editor.drawflow.drawflow.Home.data)
        this.nodeProperties.find(x => x.id === this.currentNodeSelected.id).name = this.newNodeName;
        nodeElement.innerHTML = `<div>${this.newNodeName}</div>`;
      }
    }
    modal.close();
  }

  isNameUnique(name: string): boolean {
    const nodes = this.editor.drawflow.drawflow.Home.data;
    return !Object.values(nodes).some((node) => (node as any).data?.label === name);
  }

  handleAddTag = (name: string) => {
    return { nodeid: this.selectedNodeProperties.id, key: name, value: name, nodeName: this.selectedNodeProperties.name };
  }

  onSubmit() {
    var exportJSON = this.editor.export();
    var nodeProperties = this.nodeProperties.map(node => ({
      ...node,
      selectedResponses: (node.selectedResponses ?? []).map(({ value, ...rest }) => rest),
      nodeParams: (node.nodeParams ?? []).map(param => ({
        willInclude: !!param.willInclude,
        key: param.key ?? '',
        value: param.value ?? '',
        description: param.description ?? '',
        prefix: param.prefix ?? '',
        responseKey: param.responseKey ?? '',
        responseValue: param.responseValue ?? ''
      })),
      headers: (node.headers ?? []).map(header => ({
        willInclude: !!header.willInclude,
        key: header.key ?? '',
        value: header.value ?? '',
        description: header.description ?? '',
        prefix: header.prefix ?? '',
        responseKey: header.responseKey ?? '',
        responseValue: header.responseValue ?? ''
      }))
    }));

    var payLoad: APISourceExport = {
      flpConfigurationId: '',
      exportJSON: JSON.stringify(exportJSON),
      nodeProperties: nodeProperties,
      columnNames: this.selectedNodeNames
    };

    //console.log(payLoad);
    this.apiUploadService.insertNewAPISource(payLoad, this.config).subscribe({
      next: (response) => {
        this.toastrService.success('API Source saved successfully');
        this.busyService.idle();
      },
      error: (err: ApiRequestError) => {
        this.toastrService.error(`Error saving API Source: ${err.message}`);
        this.busyService.idle();
      }
    });
  }

  retrieveValues(nodeId: number) {

  }

  isNodeConnected() {
    const connected = Object.values(this.currentNodeSelected.inputs).some((i: DrawflowNode) => i.connections.length > 0) ||
      Object.values(this.currentNodeSelected.outputs).some((o: DrawflowNode) => o.connections.length > 0);

    //this.currentNodeSelected.inputs = a node will feed from previous node
    //this.currentNodeSelected.output = it is connected to next node
    let currentNode = this.selectedNodeProperties;
    Object.values(this.currentNodeSelected.inputs).forEach((element: DrawflowNode) => {
      //console.log(currentNode);
      element.connections.forEach((j) => {
        //console.log(currentNode);
        let nodeId = j.node;
        currentNode.connectedFrom = nodeId; //assume only once connection TODO
        currentNode.showResponses = this.nodeResponses.find(x => x.nodeId === +this.selectedNodeProperties.connectedFrom) ? true : false;
      });
    });
    console.log(`Node ${this.currentNodeSelected.id} is ${connected ? '' : 'not '} connected`);
  }

  modifySettingsClose() {
    this.modifySettings = false;
  }

  stopPropagation(event: any) {
    event.stopPropagation();
  }
}
