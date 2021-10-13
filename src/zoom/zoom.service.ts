import { catchError, map, Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ZoomUser } from '../shared/interface/zoom-user.interface';

@Injectable()
export class ZoomService {
  constructor(private readonly httpService: HttpService) {}

  getUser(id: string, zoomToken: string): Observable<ZoomUser> {
    return this.httpService
      .get(`users/${id}`, {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
        },
      })
      .pipe(
        map((res) => res.data as ZoomUser),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );
  }
}
