import {Pagination} from '../pagination.types';

export interface CountedAndPaginatedList<T> {
  items: T[],
  pagination: Pagination
}
