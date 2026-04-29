import { apiRequest } from "@/lib/http";

const BASE = "/classroom-members";

export const ENROLLMENT_STATUS = Object.freeze({
	PENDING: "PENDING",
	ACCEPTED: "ACCEPTED",
	REJECTED: "REJECTED",
});

/** @param {number} classroomId */
const joinClass = (classroomId) =>
	apiRequest.post(`${BASE}/${classroomId}/join`);

/** @param {number} classroomId @param {string} emails */
const inviteStudents = (classroomId, emails) =>
	apiRequest.post(`${BASE}/${classroomId}/invite`, { emails });

/** @param {number} classroomId */
const leaveClass = (classroomId) =>
	apiRequest.delete(`${BASE}/${classroomId}/leave`);

/**
 * GET /api/classroom-members/{classroomId}
 * @param {number} classroomId
 */
const getClassroomMembers = (classroomId) =>
	apiRequest.get(`${BASE}/${classroomId}`);

/**
 * GET /api/classroom-members/{classroomId}/members
 * @param {number} classroomId
 */
const getAcceptedMembers = (classroomId) =>
	apiRequest.get(`${BASE}/${classroomId}/members`);

/**
 * POST /api/classroom-members/{classroomId}/pending/approve
 * @param {number} classroomId
 * @param {number[]} studentIds
 */
const approveRequests = (classroomId, studentIds) =>
	apiRequest.post(`${BASE}/${classroomId}/pending/approve`, { studentIds });

/**
 * POST /api/classroom-members/{classroomId}/pending/reject
 * @param {number} classroomId
 * @param {number[]} studentIds
 */
const rejectRequests = (classroomId, studentIds) =>
	apiRequest.post(`${BASE}/${classroomId}/pending/reject`, { studentIds });

/**
 * GET /api/classroom-members/my-classes
 * @param {"PENDING" | "ACCEPTED" | "REJECTED" | undefined} enrollmentStatus
 */
const getMyClassrooms = (enrollmentStatus = ENROLLMENT_STATUS.ACCEPTED) =>
	apiRequest.get(`${BASE}/my-classes`, {
		params: { enrollmentStatus },
	});

export const classroomMemberApi = {
	joinClass,
	inviteStudents,
	leaveClass,
	getClassroomMembers,
	getAcceptedMembers,
	approveRequests,
	rejectRequests,
	getMyClassrooms,
};

