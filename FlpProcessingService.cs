  public static bool IsSpreadsheetFile(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() is ".xlsx" or ".xls" or ".xlsb" or ".xlsm"
            or ".xltx" or ".xltm" or ".csv" or ".tsv" or ".ods";
}




return values.EnumerateArray()
            .Select(e => CommonUtilities.MapSharePointItem(e, folderPath))
            .Where(i => i.IsFolder || CommonUtilities.IsSpreadsheetFile(i.Name))
            .ToList();
    }
