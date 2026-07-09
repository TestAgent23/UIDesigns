import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ColumnNameDatatypeName } from '../core/models/columnNameDatatypeName';
import { ExcelRule } from '../core/models/DataInsider';
import { KeyValuePair } from '../core/models/fileConfiguration';
import { Helper } from '../core/utils/helper';
import { ModalService } from '../core/services/confirm-modal.service';
import { cleanColumnName, convertToRoman } from '../core/services/di-parser.service';
import { ToastrService } from 'ngx-toastr';
import { ModalMessages } from '../shared/enum';
import { EnglishOnlyCharacters } from '../core/models/englistOnlyCharacters';

@Component({
  selector: 'app-table-column-names',
  standalone: false,
  templateUrl: './table-column-names.component.html',
  styleUrl: './table-column-names.component.css',
})
export class TableColumnNamesComponent {

  @Output() onClose = new EventEmitter<{ action: 'save' | 'cancel' }>();
  result: string | null = null;
  columnNames: ColumnNameDatatypeName[] | null = null;
  ruleSet: ExcelRule[] = [];
  wksheets: KeyValuePair[] = [];
  englishOnlyCharacters: EnglishOnlyCharacters[];
  spanish_to_english: boolean;
  roman_numerals_only: boolean;
  constructor(
    private fb: FormBuilder,
    public bsModalRef: BsModalRef,
    private confirmModalService2: ModalService,
    private helperUtil: Helper,
    private toastr: ToastrService,
  ) {
  }

  get validColumnNames() {
    return this.columnNames.filter(x => x.willInclude);
  }

  get formValid() {
    return this.columnNames.every(x => !x.invalidColumnName);
  }
  seen: any[] = [];
  async onDBColumnNameChange(event: any, selectedColumnName: ColumnNameDatatypeName) {
    let column = this.columnNames.find((x) => x.index === selectedColumnName.index);
    const input = event.target as HTMLInputElement;
    var columnHasRule;

    var tempRule;
    tempRule = this.ruleSet;

    // columnHasRule = tempRule?.find(x => {
    //   if (x.ruleColumnName.includes(column.DbColumnName) || x.ruleColumnName2 === column.DbColumnName)
    //     return x;
    //   const escapedColumnName = this.helperUtil.escapeRegExp(column.DbColumnName);
    //   const re = new RegExp(`(^|[^@])@${escapedColumnName}\\b`, 'i');
    //   if (re.test(x.prompt)) return x;

    //   return null;
    // });

    const matchingTempRules = (tempRule ?? []).filter((x) => {
      const byColumns =
        x.ruleColumnName.includes(column.DbColumnName) ||
        x.ruleColumnName2 === column.DbColumnName;

      const escapedColumnName = this.helperUtil.escapeRegExp(column.DbColumnName);
      const re = new RegExp("(^|[^@])@" + escapedColumnName + "\\b", "i");
      const byPrompt = re.test(x.prompt ?? "");

      return byColumns || byPrompt;
    });

    const uniqueTempRules = Array.from(
      new Map(matchingTempRules.map((r: ExcelRule) => [r.id, r])).values()
    );

    if (uniqueTempRules.length > 0) {
      //this.toastr.warning(`Column ${foundValue.ColumnName} is part of a rule set, if excluded, the rule will be removed.`);
      const confirmed = await
        this.confirmModalService2
          .confirm('Validations', `Column ${column.DbColumnName} is part of a rule set.<br> If excluded, the rule will be removed. Would you like to proceed?`)
      // .then((confirmed) => {
      //   if (confirmed === true) {
      //     //remove rule in child

      //     this.ruleSet = this.ruleSet.filter(x => !x.ruleColumnName.includes(column.ColumnName));

      //     this.subOnExcludeColumn(column);
      //   } else {
      //     input.value = column.DbColumnName;
      //   }
      // });

      if (!confirmed) {
        event.target.value = column.DbColumnName;
        return;
      }

      this.ruleSet = this.ruleSet?.filter(x => !uniqueTempRules.some((r :ExcelRule) => r.id === x.id)  );

    }

    let columnName = cleanColumnName(event.target.value);
    column.DbColumnName = columnName;

    if (event.target.value === '' || columnName === '') {
      column.invalidColumnName = true;
      this.toastr.warning(ModalMessages.UniqueColumnName);
      return;
    }

    if (this.spanish_to_english) {
      column.DbColumnName = this.helperUtil.convertToEnglishOnlyCharactersPerWord(this.englishOnlyCharacters, column.DbColumnName);
    }

    if (this.roman_numerals_only) {
      column.DbColumnName = convertToRoman(columnName, false);
    }


    if (
      this.columnNames.find(
        (item) =>
          item.index !== selectedColumnName.index && item.DbColumnName === column.DbColumnName
      )
    ) {
      column.invalidColumnName = true;
      column.isDuplicateColumn = true;
      this.seen.push(column);
      //this.modalService.showNotification(false, ModalTitles.TPDataIngestion, ModalMessages.UniqueColumnName);
      this.toastr.error(ModalMessages.UniqueColumnName);
    } else {
      //column.invalidColumnName = false;

      //this.columnDatatype.find(item => item.index === index).ColumnName = event.target.value;
      column.invalidColumnName = false;
      column.isDuplicateColumn = false;
      //check if the column changed was invalid column before removing anything from seen
      const existingColumn = this.seen.find(
        (x) => x.index === selectedColumnName.index && x.invalidColumnName === false
      );
      if (existingColumn) {
        this.seen.splice(
          this.seen.findIndex((x) => x.index === selectedColumnName.index),
          1
        );
      }
    }

    const duplicates = [];
    this.columnNames.forEach((item, i) => {
      const value = item.DbColumnName;

      const found = this.seen.find(
        (x) => x.DbColumnName === value && x.index !== i
      );
      if (found) {
        found.invalidColumnName = true;
        duplicates.push(item);
      } else {
        this.columnNames.find(
          (x) => x.DbColumnName === item.DbColumnName
        ).invalidColumnName = false;
      }
    });

    if (duplicates.length === 0) this.seen = [];

    // if (this.wksheets.length > 0) {
    //   this.columnDatatypePerSheet[this.selectedWorkSheetName] = this.columnDatatype;
    //   //this.updateConfigOnly([this.config, this.columnDatatype]);
    // }
  }

  subOnExcludeColumn(column: ColumnNameDatatypeName) {
  }

  close() {
    this.onClose.emit({ action: 'cancel' });
    this.bsModalRef.hide();
  }

  save() {
    this.onClose.emit({ action: 'save' });
    this.bsModalRef.hide();
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

    if (columnHasRule)
      return true;

    return false;
  }
}
