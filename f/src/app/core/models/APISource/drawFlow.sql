-- =============================================================
--  API Source Drawflow - Table Creation Script
--  Generated from DrawFlowProperties and related interfaces
-- =============================================================

-- ---------------------------------------------------------------
--  1. DrawFlowConfiguration (maps to DrawFlowProperties)
-- ---------------------------------------------------------------
IF OBJECT_ID(N'dbo.DrawFlowConfiguration', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.DrawFlowConfiguration (
    Id              INT           IDENTITY(1,1) NOT NULL,
    Name            NVARCHAR(255) NOT NULL,
    HttpMethod      NVARCHAR(10)  NOT NULL DEFAULT 'POST',
    StringURL       NVARCHAR(2000) NULL,
    ResponseJson    NVARCHAR(MAX) NULL,
    ResponseTime    FLOAT         NULL,
    ResponseStatus  NVARCHAR(50)  NULL,
    ConnectedFrom   NVARCHAR(255) NULL,
    ConnectedTo     NVARCHAR(255) NULL,
    ShowResponses   BIT           NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(0)  NOT NULL CONSTRAINT DF_DrawFlowConfig_CreatedAt   DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(0)  NOT NULL CONSTRAINT DF_DrawFlowConfig_UpdatedAt   DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_DrawFlowConfiguration PRIMARY KEY (Id)
  );
END;
GO

-- ---------------------------------------------------------------
--  2. DrawFlowAuthorization (maps to APIAuthorization)
-- ---------------------------------------------------------------
IF OBJECT_ID(N'dbo.DrawFlowAuthorization', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.DrawFlowAuthorization (
    Id                INT           IDENTITY(1,1) NOT NULL,
    ConfigurationId   INT           NOT NULL,
    AuthType          NVARCHAR(50)  NOT NULL DEFAULT 'No Auth',  -- 'No Auth' | 'Bearer Token' | 'Basic Auth'
    BearerToken       NVARCHAR(MAX) NULL,
    UserName          NVARCHAR(255) NULL,
    PassWord          NVARCHAR(MAX) NULL,
    CONSTRAINT PK_DrawFlowAuthorization PRIMARY KEY (Id),
    CONSTRAINT FK_DrawFlowAuthorization_Configuration
      FOREIGN KEY (ConfigurationId) REFERENCES dbo.DrawFlowConfiguration (Id) ON DELETE CASCADE,
    CONSTRAINT UQ_DrawFlowAuthorization_Config UNIQUE (ConfigurationId)
  );
END;
GO

-- ---------------------------------------------------------------
--  3. DrawFlowParams (maps to APIUploadParams for params & headers)
-- ---------------------------------------------------------------
IF OBJECT_ID(N'dbo.DrawFlowParams', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.DrawFlowParams (
    Id                INT           IDENTITY(1,1) NOT NULL,
    ConfigurationId   INT           NOT NULL,
    ParamType         NVARCHAR(20)  NOT NULL,  -- 'params' | 'headers'
    WillInclude       BIT           NOT NULL DEFAULT 1,
    [Key]             NVARCHAR(500) NULL,
    [Value]           NVARCHAR(MAX) NULL,
    Description       NVARCHAR(1000) NULL,
    Prefix            NVARCHAR(500) NULL,
    ResponseKey       NVARCHAR(500) NULL,
    ResponseValue     NVARCHAR(MAX) NULL,
    SortOrder         INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_DrawFlowParams PRIMARY KEY (Id),
    CONSTRAINT FK_DrawFlowParams_Configuration
      FOREIGN KEY (ConfigurationId) REFERENCES dbo.DrawFlowConfiguration (Id) ON DELETE CASCADE,
    CONSTRAINT CK_DrawFlowParams_ParamType CHECK (ParamType IN ('params', 'headers'))
  );
END;
GO

-- ---------------------------------------------------------------
--  4. DrawFlowBodyItems (maps to APIUploadBody.formData / xWWWFormUrlEncoded)
-- ---------------------------------------------------------------
IF OBJECT_ID(N'dbo.DrawFlowBodyItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.DrawFlowBodyItems (
    Id                INT           IDENTITY(1,1) NOT NULL,
    ConfigurationId   INT           NOT NULL,
    BodyType          NVARCHAR(30)  NOT NULL,  -- 'formData' | 'xWWWFormUrlEncoded' | 'raw'
    WillInclude       BIT           NOT NULL DEFAULT 1,
    [Key]             NVARCHAR(500) NULL,
    [Value]           NVARCHAR(MAX) NULL,
    Description       NVARCHAR(1000) NULL,
    RawContent        NVARCHAR(MAX) NULL,       -- used when BodyType = 'raw'
    SortOrder         INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_DrawFlowBodyItems PRIMARY KEY (Id),
    CONSTRAINT FK_DrawFlowBodyItems_Configuration
      FOREIGN KEY (ConfigurationId) REFERENCES dbo.DrawFlowConfiguration (Id) ON DELETE CASCADE,
    CONSTRAINT CK_DrawFlowBodyItems_BodyType CHECK (BodyType IN ('formData', 'xWWWFormUrlEncoded', 'raw'))
  );
END;
GO

-- ---------------------------------------------------------------
--  5. DrawFlowSelectedResponses (maps to APISelectedResponse)
-- ---------------------------------------------------------------
IF OBJECT_ID(N'dbo.DrawFlowSelectedResponses', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.DrawFlowSelectedResponses (
    Id                INT           IDENTITY(1,1) NOT NULL,
    ConfigurationId   INT           NOT NULL,
    NodeId            INT           NOT NULL,
    NodeName          NVARCHAR(255) NULL,
    [Key]             NVARCHAR(500) NOT NULL,
    [Value]           NVARCHAR(MAX) NULL,
    CONSTRAINT PK_DrawFlowSelectedResponses PRIMARY KEY (Id),
    CONSTRAINT FK_DrawFlowSelectedResponses_Configuration
      FOREIGN KEY (ConfigurationId) REFERENCES dbo.DrawFlowConfiguration (Id) ON DELETE CASCADE
  );
END;
GO

-- ---------------------------------------------------------------
--  Indexes
-- ---------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DrawFlowParams_ConfigurationId' AND object_id = OBJECT_ID('dbo.DrawFlowParams'))
  CREATE INDEX IX_DrawFlowParams_ConfigurationId    ON dbo.DrawFlowParams    (ConfigurationId, ParamType);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DrawFlowBodyItems_ConfigurationId' AND object_id = OBJECT_ID('dbo.DrawFlowBodyItems'))
  CREATE INDEX IX_DrawFlowBodyItems_ConfigurationId ON dbo.DrawFlowBodyItems (ConfigurationId, BodyType);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DrawFlowSelectedResponses_ConfigurationId' AND object_id = OBJECT_ID('dbo.DrawFlowSelectedResponses'))
  CREATE INDEX IX_DrawFlowSelectedResponses_ConfigurationId ON dbo.DrawFlowSelectedResponses (ConfigurationId, NodeId);
GO
