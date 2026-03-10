import { apiRequest } from "@/lib/http";

const BASE = "/enrollments";

/** @param {number} classroomId */
const joinClass = (classroomId) =>
  apiRequest.post(`${BASE}/${classroomId}/join`);

/** @param {number} classroomId */
const leaveClass = (classroomId) =>
  apiRequest.delete(`${BASE}/${classroomId}/leave`);

/**
 * GET /api/enrollments/{classroomId}/pending
 * @param {number} classroomId
 */
const getPendingMembers = (classroomId) =>
  apiRequest.get(`${BASE}/${classroomId}/pending`);

/**
 * POST /api/enrollments/{classroomId}/pending/approve
 * @param {number} classroomId
 * @param {number[]} memberIds
 */
const approveRequests = (classroomId, memberIds) =>
  apiRequest.post(`${BASE}/${classroomId}/pending/approve`, { memberIds });

/**
 * POST /api/enrollments/{classroomId}/pending/reject
 * @param {number} classroomId
 * @param {number[]} memberIds
 */
const rejectRequests = (classroomId, memberIds) =>
  apiRequest.post(`${BASE}/${classroomId}/pending/reject`, { memberIds });

/**
 * GET /api/enrollments/my-classes
 * Returns classrooms where the current student has ACCEPTED status
 */
const getMyClassrooms = () =>
  apiRequest.get(`${BASE}/my-classes`);

export const enrollmentApi = {
  joinClass,
  leaveClass,
  getPendingMembers,
  approveRequests,
  rejectRequests,
  getMyClassrooms,
};
