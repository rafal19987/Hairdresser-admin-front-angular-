import {Pagination} from '../pagination.types';

export interface CountedAndPaginatedList<T> {
  items: T[],
  pagination: Pagination
}

export interface ApiResponse {
  statusCode: number;
  message: string;
  data?: any;
}
