import { ZoomAccountType } from '../enum/zoom-type.enum';

export interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: ZoomAccountType;
  language: string;
  pic_url: string;
  account_id: string;
  status: 'pending' | 'active' | 'inactive';
}
