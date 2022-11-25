import { injectable } from "inversify";
import { Observable } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { map } from "rxjs/operators";

export type UserCommentChartData = {
  userId: string;
  userName: string;
  commentCount: number;
};

type CommentDTO = {
  id: number;
  body: string;
  postId: number;
  user: {
    id: number;
    username: string;
  };
};

const groupBy = <T>(data: T[], keyFn: (item: T) => string | number) =>
  data.reduce((agg: any, item: any) => {
    const group = keyFn(item);
    agg[group] = [...(agg[group] || []), item];
    return agg;
  }, {});

@injectable()
export class ChartDataService {
  /** давайте построи график зависимости пользователя количества его комментариев  */
  public getDataChart(): Observable<UserCommentChartData[]> {
    const resp = fromFetch("https://dummyjson.com/comments", {
      selector: (response) => response.json() as Promise<{ comments: CommentDTO[] }>,
    }).pipe(
      map((data) => groupBy(data.comments, (item) => item.user.id)),
      map((group) =>
        [...Object.entries(group)].map(
          ([userId, comments]) =>
            ({
              userId,
              userName: (comments as CommentDTO[])[0].user.username,
              commentCount: (comments as CommentDTO[]).length,
            } as UserCommentChartData)
        )
      )
    );

    return resp;
  }
}
