import { ColumnNameDatatypeName } from '../columnNameDatatypeName';

export interface DrawFlowProperties {
  name : string;
  id: number;
  httpMethod: string;
  stringURL: string;
  nodeParams : APIUploadParams[];
  headers : APIUploadParams[];
  body :APIUploadBody;
  response : any;
  responseTime : number;
  responseStatus : any;
  authorization : APIAuthorization;
  selectedResponses : APISelectedResponse[];
  connectedFrom? : string; //can have multiple use []
  connectedTo? : string; //can have multiple use []
  showResponses : boolean;
}

export interface APIUploadParams {
  willInclude: boolean;
  key: string;
  value: string;
  description: string;
  prefix?: string;
  responseKey?: string;
  responseValue?: string;
}

export interface APIUploadBody {
  formData : APIUploadParams[];
  xWWWFormUrlEncoded : APIUploadParams[];
  raw : string;
}

export interface APISelectedResponse {
  nodeId : number;
  nodeName : string;  
  key: string;
  value?: string;
}

export interface APIAuthorization {
  authType : string;
  bearerToken : string;
  userName : string;
  password : string;
}

export interface APIDrawflowNode {
  id: number;
  name: string;
  data: Record<string, any>;
  pos_x: number;
  pos_y: number;
  class?: string;
  html?: string;
  typenode?: boolean;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  [key: string]: any;
}

export interface NodeResponses {

  nodeId : number;
  responses : APISelectedResponse[];
}

export interface APINodeMapping {
  nodeId: number;
  nodeName: string;
  columns: ColumnNameDatatypeName[];
  rows: Record<string, any>[];
}

export interface APISourceExport {
  exportJSON : string;
  flpConfigurationId : string;
  nodeProperties : DrawFlowProperties[];
  columnNames? : string[];
}

