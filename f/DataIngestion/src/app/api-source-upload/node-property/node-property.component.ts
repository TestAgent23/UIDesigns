import { Component, EventEmitter, Input, Output } from '@angular/core';
import Drawflow, { DrawflowNode } from 'drawflow';
import { DrawFlowProperties } from '../../core/models/APISource/drawFlow';
import { ApiSourceUploadComponent } from '../api-source-upload.component';

interface ResponseTreeNode {
  key: string;
  path: string;
  children: ResponseTreeNode[];
  value?: any;
  nodeType: 'leaf' | 'object' | 'array';
  childCount?: number;
}

@Component({
  selector: 'app-node-property',
  standalone: false,
  templateUrl: './node-property.component.html',
  styleUrl: './node-property.component.css',
})
export class NodePropertyComponent {
  @Input() currentNodeSelected: DrawflowNode | undefined;
  @Input() selectedNodeProperties?: DrawFlowProperties;
  @Input() parent!: ApiSourceUploadComponent;
  @Output() methodChange = new EventEmitter<Event>();
  private lastResponseFingerprint = '';
  private responseTabVisited = false;

  get activeTab(): string {
    return this.parent?.activeTab ?? 'params';
  }

  get activeBodyName(): string {
    return this.parent?.activeBodyName ?? 'none-body';
  }

  get authTypes(): string[] {
    return this.parent?.authTypes ?? [];
  }

  get nodeResponses() {
    return this.parent?.nodeResponses ?? [];
  }

  get toggleMap() {
    return this.parent?.toggleMap ?? {};
  }

  get handleAddTag() {
    return this.parent?.handleAddTag;
  }

  get hasUnreadResponse(): boolean {
    this.syncResponseNoticeState();
    return !!this.selectedNodeProperties?.responseStatus
      && this.selectedNodeProperties.responseStatus > 0
      && !this.responseTabVisited
      && this.activeTab !== 'response';
  }

  onMethodChange(event: Event) {
    this.methodChange.emit(event);
  }

  onURLChange(event: Event) {
    this.parent?.onURLChange(event);
  }

  onSelectedNodeSend() {
    this.parent?.onSelectedNodeSend();
  }

  onTabChange(tabName: string) {
    this.syncResponseNoticeState();
    if (tabName === 'response') {
      this.responseTabVisited = true;
    }
    this.parent?.onTabChange(tabName);
  }

  private syncResponseNoticeState(): void {
    const nodeId = this.currentNodeSelected?.id ?? 0;
    const status = this.selectedNodeProperties?.responseStatus ?? 0;
    const responseTime = this.selectedNodeProperties?.responseTime ?? 0;
    const fingerprint = `${nodeId}|${status}|${responseTime}`;

    if (this.lastResponseFingerprint !== fingerprint) {
      this.lastResponseFingerprint = fingerprint;
      this.responseTabVisited = this.activeTab === 'response';
    }
  }

  onInputChange(rowType: string, id: number, event: any, input: string) {
    this.parent?.onInputChange(rowType, id, event, input);
  }

  onAuthTypeChange(event: Event) {
    this.parent?.onAuthTypeChange(event);
  }

  onShowPassword(ctrlName: string, event: Event) {
    this.parent?.onShowPassword(ctrlName, event);
  }

  onSelect(param: string, event: any, rowIndex?: number) {
    this.parent?.onSelect(param, event, rowIndex);
  }

  onBodyTypeChange(selectedBodyName: string) {
    this.parent?.onBodyTypeChange(selectedBodyName);
  }

  onInputBodyChange(rowType: string, id: number, event: any, input: string) {
    this.parent?.onInputBodyChange(rowType, id, event, input);
  }

  onFormatJsonInput() {
    this.parent?.onFormatJsonInput();
  }

  onPasteRaw(event: any) {
    this.parent?.onPasteRaw(event);
  }

  onSelectedResponse(event: any, keyPath: string, data: any) {
    this.parent?.onSelectedResponse(event, keyPath, data);
  }

  toggleNode(key: string): void {
    this.parent?.toggleNode(key);
  }

  isObject(value: any): boolean {
    return this.parent?.isObject(value) ?? false;
  }

  getKeys(obj: any): string[] {
    return this.parent?.getKeys(obj) ?? [];
  }

  getValueByPath(obj: any, path: string) {
    return this.parent?.getValueByPath(obj, path);
  }

  isArray(value: any): boolean {
    return this.parent?.isArray(value) ?? Array.isArray(value);
  }

  buildResponseTree(obj: any, prefix = ''): ResponseTreeNode[] {
    if (!obj || typeof obj !== 'object') return [];
    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        const itemPath = prefix ? `${prefix}[${index}]` : `[${index}]`;
        return this.buildArrayItemNode(item, itemPath, `[${index}]`);
      });
    }

    const nodes: ResponseTreeNode[] = [];
    for (const key of Object.keys(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];

      if (val !== null && val !== undefined && typeof val === 'object') {
        if (Array.isArray(val)) {
          const arrKey = `${key}[*]`;
          const arrPath = `${path}[*]`;
          const children = val.map((item, index) =>
            this.buildArrayItemNode(item, `${path}[${index}]`, `[${index}]`)
          );
          nodes.push({
            key: arrKey,
            path: arrPath,
            children,
            nodeType: 'array',
            childCount: val.length
          });
        } else {
          nodes.push({
            key,
            path,
            children: this.buildResponseTree(val, path),
            nodeType: 'object',
            childCount: Object.keys(val).length
          });
        }
      } else {
        nodes.push({ key, path, children: [], value: val, nodeType: 'leaf' });
      }
    }

    return nodes;
  }

  private buildArrayItemNode(item: any, path: string, key: string): ResponseTreeNode {
    if (item !== null && item !== undefined && typeof item === 'object') {
      if (Array.isArray(item)) {
        const children = item.map((nestedItem, nestedIndex) =>
          this.buildArrayItemNode(nestedItem, `${path}[${nestedIndex}]`, `[${nestedIndex}]`)
        );
        return {
          key,
          path,
          children,
          nodeType: 'array',
          childCount: item.length
        };
      }

      return {
        key,
        path,
        children: this.buildResponseTree(item, path),
        nodeType: 'object',
        childCount: Object.keys(item).length
      };
    }

    return {
      key,
      path,
      children: [],
      value: item,
      nodeType: 'leaf'
    };
  }

}
