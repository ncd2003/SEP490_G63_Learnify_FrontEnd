import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  ClassroomSchema,
  CreateClassroomSchema,
  UpdateClassroomSchema,
} from "@/schema/classroom.schema";

/** @typedef {import("@/schema/classroom.schema").TClassroom} TClassroom */
/** @typedef {import("@/schema/type.schema").ApiResponse<TClassroom>} ClassroomResponse */
/** @typedef {import("@/schema/type.schema").ApiResponse<TClassroom[]>} ClassroomListResponse */

const BASE = API_SUFFIX.CLASSROOM;

/* ─── Classroom CRUD ─────────────────────────────────────────────────────── */

/**
 * @returns {Promise<import("axios").AxiosResponse<ClassroomListResponse>>}
 */
const getClassroomsByTeacher = () =>
  apiRequest.get(`${BASE}/teacher`);

/**
 * @param {number} id
 * @returns {Promise<import("axios").AxiosResponse<ClassroomResponse>>}
 */
const getClassroomById = (id) =>
  apiRequest.get(`${BASE}/${id}`);

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
    new Blob([JSON.stringify(parsed)], { type: "application/json" })
  );
  if (file) formData.append("file", file);
  return apiRequest.put(`${BASE}/${id}`, formData);
};

/**
 * @param {number} id
 * @returns {Promise<import("axios").AxiosResponse>}
 */
const deleteClassroom = (id) =>
  apiRequest.delete(`${BASE}/${id}`);

/* ─── Export ─────────────────────────────────────────────────────────────── */
export const classroomApi = {
  getClassroomsByTeacher,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
};
