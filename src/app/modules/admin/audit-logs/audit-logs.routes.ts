import {Route} from '@angular/router';
import {AuditLogsListComponent} from './audit-logs-list/audit-logs-list.component';

export default [
  {
    path: '',
    component: AuditLogsListComponent,
    title: 'Logi zdarzeń',
  },
] as Route[];
