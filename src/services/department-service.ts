import { DepartmentRepository, ListDepartmentsFilters } from '@/repositories/department-repository';
import { DepartmentData } from '@/models/department-model';
import { UserData } from '@/models/user-model';

export class DepartmentService {
  /** List departments with pagination, filter, sort, and search */
  static async listDepartments(query: Record<string, unknown>) {
    const filters: ListDepartmentsFilters = {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      search: query.search as string | undefined,
      status: query.status as 'active' | 'inactive' | undefined,
      sort_by: query.sort_by as 'name' | 'created_at' | undefined,
      sort_order: query.sort_order as 'asc' | 'desc' | undefined,
    };
    return DepartmentRepository.list(filters);
  }

  /** Search departments by name (for suggestions/autocomplete) */
  static async searchDepartmentsByName(name: string, limit = 10) {
    const filters: ListDepartmentsFilters = {
      search: name,
      limit,
    };
    const result = await DepartmentRepository.list(filters);
    return result.data;
  }

  /** Get department detail by id */
  static async getDepartmentById(id: number) {
    return DepartmentRepository.findById(id);
  }

  /** Create department */
  static async createDepartment(
    payload: Partial<DepartmentData>,
    createdBy: UserData,
  ) {
    // Validasi nama unik (case-insensitive)
    const exists = await DepartmentRepository.existsByName(payload.name!);
    if (exists) {
      throw new Error('Department name must be unique');
    }
    const department = await DepartmentRepository.create({
      ...payload,
      created_by: createdBy.id,
      status: payload.status ?? 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return department;
  }

  /** Update department */
  static async updateDepartment(
    id: number,
    payload: Partial<DepartmentData>,
    updatedBy: UserData,
  ) {
    // Validasi nama unik (case-insensitive)
    if (payload.name) {
      const exists = await DepartmentRepository.existsByName(payload.name, id);
      if (exists) {
        throw new Error('Department name must be unique');
      }
    }
    const department = await DepartmentRepository.updateById(id, {
      ...payload,
      updated_at: new Date(),
    });
    if (!department) throw new Error('Department not found');
    return department;
  }

  /** Delete department (with constraint) */
  static async deleteDepartment(id: number, deletedBy: UserData) {
    // Cek constraint: tidak boleh hapus jika ada job posting aktif
    const hasActive = await DepartmentRepository.hasActiveJobPostings(id);
    if (hasActive) {
      throw new Error('Department cannot be deleted because it has active job postings');
    }
    const department = await DepartmentRepository.softDeleteById(id);
    if (!department) throw new Error('Department not found');
    return department;
  }

  /** Change department status (active/inactive) */
  static async changeStatus(id: number, status: 'active' | 'inactive', updatedBy: UserData) {
    const department = await DepartmentRepository.updateById(id, {
      status,
      updated_at: new Date(),
    });
    if (!department) throw new Error('Department not found');
    return department;
  }
} 