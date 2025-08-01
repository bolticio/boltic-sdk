export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateOperation<TCreate, TResult> {
  create(data: TCreate): Promise<{ data: TResult; error?: string }>;
}

export interface ReadOperation<TQuery, TResult> {
  findOne(options: TQuery): Promise<{ data: TResult | null; error?: string }>;
  findAll(options?: TQuery): Promise<{
    data: TResult[];
    pagination?: PaginationInfo;
    error?: string;
  }>;
}

export interface UpdateOperation<TUpdate, TResult> {
  update(id: string, data: TUpdate): Promise<{ data: TResult; error?: string }>;
  update(options: { where: Record<string, unknown>; set: TUpdate }): Promise<{
    data: TResult[];
    error?: string;
  }>;
}

export interface DeleteOperation {
  delete(id: string): Promise<{ success: boolean; error?: string }>;
  delete(options: { where: Record<string, unknown> }): Promise<{
    deletedCount: number;
    error?: string;
  }>;
}

export interface CrudOperations<TCreate, TUpdate, TResult, TQuery = unknown>
  extends CreateOperation<TCreate, TResult>,
    ReadOperation<TQuery, TResult>,
    UpdateOperation<TUpdate, TResult>,
    DeleteOperation {}
