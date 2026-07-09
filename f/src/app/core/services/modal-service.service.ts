import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { NotificationComponent } from '../../shared/components/notification/notification.component';
import { FilePreviewComponent } from '../../new-process-configuration/file-preview/file-preview.component';
import { ColumnNameDatatypeName } from '../models/columnNameDatatypeName';
import { RegexBuilderComponent } from '../../regex-builder/regex-builder.component';
import { TableColumnNamesComponent } from '../../table-column-names/table-column-names.component';
import { ExcelRule } from '../models/DataInsider';
import { KeyValuePair } from '../models/fileConfiguration';
import { EnglishOnlyCharacters } from '../models/englistOnlyCharacters';
import { RegexItem } from '../models/additionalSettings';

@Injectable({
  providedIn: 'root'
})
export class ModalServiceService {
  bsModalRef? : BsModalRef

  constructor(
    private modalService : BsModalService
  ) { }

  showNotification(isSuccess: boolean, title: string, message: string) {
    const initialState: ModalOptions = {
      initialState: {
        isSuccess,
        title,
        message
      }
    };

    this.bsModalRef = this.modalService.show(NotificationComponent, initialState);
  }

  showFilePreview(
    delimiter : string, 
    flexCheckHasHeaders : boolean, 
    txtQuoteCharacter : string,
    skipRows : number,
    skipFooterRows : number,
    fileName : string,
    recordHeaders : ColumnNameDatatypeName[] | null
   ){
    const config: ModalOptions = {
      backdrop: 'static',
      keyboard: false,
      ignoreBackdropClick: true,
      class: 'custom-class',
      initialState : {
        fileName,
        recordHeaders,
        delimiter,
        flexCheckHasHeaders,
        txtQuoteCharacter,
        skipRows,
        skipFooterRows
      }
    }
    return this.bsModalRef = this.modalService.show(FilePreviewComponent, config);
  }

  showCustomRegexBuilder(existingRegex? : RegexItem ){
    const config: ModalOptions = {
      backdrop: 'static',
      keyboard: false,
      ignoreBackdropClick: true,
      class: 'custom-class',
      initialState : {
        existingRegex:  existingRegex ?? null
      }
    }
    return this.bsModalRef = this.modalService.show(RegexBuilderComponent, config);
  }

  showCustomizeTableNames(
    columnNames : ColumnNameDatatypeName[] | null, 
    ruleSet : ExcelRule[] | null,
    englishOnlyCharacters: EnglishOnlyCharacters[] | null,
    spanish_to_english : boolean,
    roman_numerals_only : boolean
    ){
    const config: ModalOptions = {
      backdrop: 'static',
      keyboard: false,
      ignoreBackdropClick: true,
      class: 'custom-class',
      initialState : {
        columnNames:  columnNames ?? null,
        ruleSet: ruleSet ?? null,
        englishOnlyCharacters: englishOnlyCharacters ?? null
      }
    }
    return this.bsModalRef = this.modalService.show(TableColumnNamesComponent, config);
  }
}
