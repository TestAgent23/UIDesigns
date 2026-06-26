For SharePoint Configuration First (processTypeId = 6) on the File Process Status page, we added a frontend-only integration in two files and left existing DI services, backend logic, and Function App unchanged. New file: FRONTEND/src/app/sharepoint/services/sharepoint-configuration-first-runtime.service.ts (#region SharePoint Workspace - AY) — on page load it calls POST api/Import/GetProcessList (header x-tpdi-api-version: 1.0) with request { "processTypeId": 6 }, then for each file in the response it calls POST api/Import/ProcessExcelFile (v3.0, or v4.0 for DataBricks). GetProcessList response shape (relevant SharePoint fields):

{
  "responseCode": 200,
  "responseMessage": ["Success"],
  "result": [
    {
      "flpConfigurationId": "9E0F7426-A149-4D36-AE39-5E321F93AD9E",
      "processName": "DI_CACANAG6",
      "processTypeId": 6,
      "locationTypeId": 4,
      "sourcePath": "Document-2/Test",
      "destinationPath": "CANADA/Canada/Agents Only/",
      "billingClientName": "Airbnb",
      "fileProcessingServerTypeId": 1,
      "sharePointFiles": [
        {
          "uploadedId": "72EF142B-EA0E-4B32-B571-948D7242998F",
          "fileUrl": "Document-2/Test/Testing21.xlsx",
          "fileSize": 41337
        }
      ],
      "blobClients": null,
      "onPremFileLocations": null
    }
  ]
}
ProcessExcelFile request payload (one call per item in sharePointFiles):

{
  "flpConfigurationId": "9E0F7426-A149-4D36-AE39-5E321F93AD9E",
  "processName": "DI_CACANAG6",
  "sharePointFileLocation": {
    "uploadedId": "72EF142B-EA0E-4B32-B571-948D7242998F",
    "fileUrl": "Document-2/Test/Testing21.xlsx",
    "fileSize": 41337
  }
}
In FRONTEND/src/app/file-processing-status/file-processing-status.component.ts, ngOnInit calls runDueSharePointProcesses() first; on complete or error it runs the existing getFileUploadedStatus() (GET api/Status/FileUploadStatus) and keeps the existing poll via getStatus(), so the UI shows Client → process name → file with the same step checklist as blob/on-prem. Prerequisites: config saved with processTypeId = 6, locationTypeId = 4, scheduler due, files present in SharePoint; backend SharePoint branches for GetProcessList and ProcessExcelFile must already be deployed.
