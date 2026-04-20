import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  ClassroomSchema,
  CreateClassroomSchema,
  UpdateClassroomSchema,
} from "@/schema/classroom.schema";

/** @typedef {import("@/schema/classroom.schema").TClassroom} TClassroom */
/**
 * @typedef {Object} PagingResult
 * @property {TClassroom[]} content
 * @property {number} pageNumber
 * @property {number} pageSize
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} last
 */
/** @typedef {import("@/schema/type.schema").ApiResponse<PagingResult>} ClassroomPagingResponse */
/** @typedef {import("@/schema/type.schema").ApiResponse<TClassroom>} ClassroomResponse */

const BASE = API_SUFFIX.CLASSROOM;

/* ─── Classroom CRUD ─────────────────────────────────────────────────────── */

/**
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @returns {Promise<import("axios").AxiosResponse<ClassroomPagingResponse>>}
 */
const getClassroomsByUser = (params = {}) =>
  apiRequest.get(`${BASE}`, { params });

/**
 * @param {number} id
 * @returns {Promise<import("axios").AxiosResponse<ClassroomResponse>>}
 */
const getClassroomById = (id) => apiRequest.get(`${BASE}/${id}`);

/**
 * @param {number|string} classroomId
 * @returns {Promise<import("axios").AxiosResponse>}
 */
const getAssignmentsForClassroom = (classroomId) =>
  apiRequest.get(`${BASE}/${classroomId}/assignments`);

/**
 * @param {number|string} classroomId
 * @param {Object} [params]
 * @param {"TODO"|"COMPLETED"|"OVERDUE"} [params.category]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @returns {Promise<import("axios").AxiosResponse>}
 */
const getStudentAssignmentsByCategory = (classroomId, params = {}) =>
  apiRequest.get(`${BASE}/${classroomId}/assignments`, { params });

/**
 * @param {number|string} classroomId
 * @returns {Promise<import("axios").AxiosResponse>}
 */
const getCategorizedAssignmentsForClassroomDashboard = (classroomId) =>
  apiRequest.get(`${BASE}/${classroomId}/assignments/dashboard`);

/**
 * @param {import("@/schema/classroom.schema").TCreateClassroom} data
 * @param {File|null} file
 * @returns {Promise<import("axios").AxiosResponse<ClassroomResponse>>}
 */
const createClassroom = (data, file = null) => {
  const parsed = CreateClassroomSchema.parse(data);
  const formData = new FormData();
  formData.append("name", parsed.name);
  formData.append("subject", parsed.subject);
  if (parsed.description) formData.append("description", parsed.description);
  if (file) formData.append("file", file);
  return apiRequest.post(BASE, formData);
};

/**
 * @param {number} id
 * @param {import("@/schema/classroom.schema").TUpdateClassroom} data
 * @param {File|null} file
 * @returns {Promise<import("axios").AxiosResponse<ClassroomResponse>>}
 */
const updateClassroom = (id, data, file = null) => {
  const parsed = UpdateClassroomSchema.parse(data);
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(parsed)], { type: "application/json" }),
  );
  if (file) formData.append("file", file);
  return apiRequest.put(`${BASE}/${id}`, formData);
};

/**
 * @param {number} id
 * @returns {Promise<import("axios").AxiosResponse>}
 */
const deleteClassroom = (id) => apiRequest.delete(`${BASE}/${id}`);

/**
 * @param {string} code
 * @returns {Promise<import("axios").AxiosResponse<ClassroomResponse>>}
 */
const searchByCode = (code) =>
  apiRequest.get(`${BASE}/search`, { params: { code } });

/* ─── Export ─────────────────────────────────────────────────────────────── */
export const classroomApi = {
  getClassroomsByUser,
  getClassroomById,
  getAssignmentsForClassroom,
  getStudentAssignmentsByCategory,
  getCategorizedAssignmentsForClassroomDashboard,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  searchByCode,
};
