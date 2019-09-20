import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from '../../../services/user.service';
import swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';

declare var $: any;

@Component({
  selector: 'app-disabled-users',
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [   // :enter is alias to 'void => *'
          style({opacity:0}),
          animate(500, style({opacity:1})) 
        ]),
        transition(':leave', [   // :leave is alias to '* => void'
          animate(500, style({opacity:0})) 
        ])
      ])
  ],
  templateUrl: './disabled-users.component.html',
  styleUrls: ['./disabled-users.component.scss']
})
export class DisabledUsersComponent implements OnInit, OnDestroy {

  public loading = false; 

  datatable: any;
  _disabled_users: any = [];
  
  no_record_message: string = 'No records found.';

  userGetAllDeletedSubscription: Subscription;
  userPutRestoreSubscription: Subscription;
  _restore: any = '';

  constructor(private userService: UserService,
              private titleService: Title,) { }

  ngOnInit() {

    // set page title
    this.titleService.setTitle('Connext Forms - Disabled Accounts');
    const $this = this;
    this.userService.httpGetAllDeletedUser();
    this.loading = true;
    $("#viewlist-table").hide();

    this.userGetAllDeletedSubscription = this.userService.userGetAllDeleted.subscribe(
      (records: any) => {
        if (typeof(records) !== 'undefined' && records.success) {
          this._disabled_users = records.data;

          if ( $.fn.dataTable.isDataTable('#viewlist-table') ) {
            $("#viewlist-table").dataTable().fnDestroy();
          }

          if (records.data.length > 0) {
            setTimeout(() => {
              $this.datatable = $('#viewlist-table').dataTable();
              this.loading = false;
              $("#viewlist-table").fadeIn();
            }, 500);
          } else {
            this.loading = false;
          }
        } if (typeof(records) !== 'undefined' && records.success == false) {
          swal('Error', 'Unable to fetch records. <br><br>' + records.message, 'error');
          this.no_record_message = 'No records found. ' + records.message;
          this.loading = false;
        }
      }
    );

    this.userPutRestoreSubscription = this.userService.userPutRestore.subscribe(
      (user: any) => {
        if (typeof(user) !== 'undefined' && user.success) {
          swal({
            position: 'top-end',
            type: 'success',
            title: 'User restored.',
            showConfirmButton: false,
            timer: 1500
          });

          this.loading = false;

          // delete row from datatable
          const table = $('#viewlist-table').DataTable();
          table.row($('#' + this._restore)).remove().draw();

        } else if (typeof(user) !== 'undefined' && user.success === false) {
          swal('Restore failed', 'Unable to restore user. <br><br>' + user.message, 'error');
          this.loading = false;
        }
      }
    );
    
  }

  onRefreshRecords() {
    this.loading = true;
    $("#viewlist-table").hide();
    this.userService.httpGetAllDeletedUser();
  }

  onRestoreRecord(id: any) {
    const that = this;
    swal({
      title: 'Restore archived line of business?',
      text: "It will be listed back to active LOB's.",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore it!'
    }).then(function(result) {
      if (result.value) {
        that.loading = true;
        that.userService.httpPostUserRestore(id);
        that._restore = id;
      }
    });
  }

  ngOnDestroy() {
    this.userGetAllDeletedSubscription.unsubscribe();
    this.userPutRestoreSubscription.unsubscribe();
  }

}
