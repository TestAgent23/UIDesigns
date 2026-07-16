import { Component, Input } from '@angular/core';
import { AdditionalSettings, RegexItem } from '../core/models/additionalSettings';
import { ColumnNameDatatypeName } from '../core/models/columnNameDatatypeName';
import { ExcelRule } from '../core/models/DataInsider';
import { DateTimeFormats } from '../core/models/datatypeNames';
import { KeyValuePair } from '../core/models/fileConfiguration';
import { SelectedFiles } from '../core/models/LandingLayer/landingLayer';
import { NavigateService } from '../core/services/navigate.service';
import { Helper } from '../core/utils/helper';
import { FileType, DataSourceType } from '../shared/enum';

@Component({
  selector: 'app-file-first-preview',
  standalone: false,
  templateUrl: './file-first-preview.component.html',
  styleUrl: './file-first-preview.component.css',
})
export class FileFirstPreviewComponent {
  @Input() config: AdditionalSettings; // Adjust the type as needed
  @Input() ruleSet: ExcelRule[] = [];
  @Input() columnDataType: ColumnNameDatatypeName[] = [];
  @Input() fileType: string;
  @Input() dateTimeNames: DateTimeFormats[] = [];
  @Input() wksheets: KeyValuePair[] = [];
  @Input() multiSheetConfigs: { [sheetName: string]: AdditionalSettings } = {};
  @Input() columnDatatypePerSheet: { [sheetName: string]: ColumnNameDatatypeName[] } = {};
  @Input() selectedFiles: SelectedFiles[] = [];
  @Input() selectedExtensions: string[] = [];
  FileTypes = FileType;
  DataSourceTypes = DataSourceType;
  ignoreDuplicates: string = '';
  securityGroups: string = '';
  delimiter: string = '';
  dedupColumnList: string = '';
  selectedSheet: string = '';
  dataSourceType: string = '';
  regexForDisplay: RegexItem[] = [];
  dateFormatDisplay: string = '';
  timeFormatDisplay: string = '';
  timeFormatId: number = 0;
  constructor(public navigateService: NavigateService,
    private helperUtil: Helper
  ) { }

  ngOnInit(): void {
    // Initialization logic if needed
    //this.dataSourceName = this.navigateService.dataSource;

    if (this.config && (this.fileType === FileType.CommaSeparatedValues || this.fileType === FileType.TextFiles)) {
      this.securityGroups = this.config.securityGroups.map(group => group.securityGroupName).join(', ');
      this.dedupColumnList = this.columnDataType.filter(col => col.columnForDedeup).map(col => col.ColumnName).join(', ');
      this.regexForDisplay = this.helperUtil.toRegexArray(this.config.landingLayerRegex);

      if (this.config.delimiter === ',') {
        this.delimiter = 'Comma (,)';
      } else if (this.config.delimiter === '\t') {
        this.delimiter = 'Tab (\\t)';
      } else if (this.config.delimiter === '|') {
        this.delimiter = 'Pipe (|)';
      } else if (this.config.delimiter === ';') {
        this.delimiter = 'Semicolon (;)';
      }
      else {
        this.delimiter = 'Others (' + this.config.delimiter + ')';
      }
      if (this.config.ignore_duplicate_rows) {

      }

      this.ruleSet = this.config.ruleSet || [];
    }

    this.dateFormatDisplay = this.dateTimeNames.find(dt => dt.formatId === this.config.landingLayerDateformat)?.format || '';
    this.timeFormatDisplay = this.dateTimeNames.find(dt => dt.formatId === this.config.landingLayerTimeformat)?.format || '';

    if (this.validWorkSheets.length > 0) {
      this.selectedSheet = this.validWorkSheets[0].sheetName;
      this.config = this.multiSheetConfigs[this.selectedSheet];
      this.ruleSet = this.config.ruleSet || [];
      this.securityGroups = this.config.securityGroups.map(group => group.securityGroupName).join(', ');
      this.delimiter = 'Tab (\\t)';
    }
  }
  get validWorkSheets() {
    return this.wksheets.filter(sheet => !sheet.ignoreSheet);
  }

  get includedColumnDataType(): ColumnNameDatatypeName[] {
    return this.columnDataType.filter(column => column.willInclude === true);
  }

  getDestinationDisplay() {
    var display = ''
    if ([DataSourceType.DataBricks, DataSourceType.LandingLayer].includes(this.navigateService.dataSource)) {
      display = 'Destination';
    }

    if (this.navigateService.dataSource === DataSourceType.Default) {
      display = 'Database';
      if (this.selectedSheet) {
        display += ' - ' + this.selectedSheet;
      }
    }
    return display;
  }

  getDateTimeFormatDisplay(id: number) {
    return this.dateTimeNames.find(dt => dt.formatId === id)?.format || '';
  }

  selectSheet(sheetName: string) {
    this.selectedSheet = sheetName;
    this.config = this.multiSheetConfigs[this.selectedSheet];
    this.ruleSet = this.config.ruleSet || [];
    this.dedupColumnList = this.columnDatatypePerSheet[sheetName]?.filter(col => col.columnForDedeup).map(col => col.ColumnName).join(', ') || '';
    this.columnDataType = this.columnDatatypePerSheet[sheetName] || [];
  }

  hasValidationRule(columnName: string): boolean {
    var columnHasRule = this.ruleSet?.find(x => {
      if (x.ruleColumnName.includes(columnName) || x.ruleColumnName2 === columnName)
        return x;
      const escapedColumnName = this.helperUtil.escapeRegExp(columnName);
      const re = new RegExp(`(^|[^@])@${escapedColumnName}\\b`, 'i');
      if (re.test(x.prompt)) return x;

      return null;
    });

    if(columnHasRule)
      return true;

    return false;
  }

  get sheetConfigKeys() {
    return Object.keys(this.wksheets);
  }
}
