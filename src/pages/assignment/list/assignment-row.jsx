import { memo } from "react";
import {
  CATEGORY_LABEL_MAP,
  FORMAT_LABEL_MAP,
  formatAssignmentDateTime,
  STATUS_LABEL_MAP,
} from "@/pages/assignment/assignment-options";

const AssignmentRow = memo(({ item }) => {
  return (
    <tr>
      <td>{item.title || `Assignment #${item.id}`}</td>
      <td>{CATEGORY_LABEL_MAP[item.category] || item.category || "-"}</td>
      <td>{FORMAT_LABEL_MAP[item.format] || item.format || "-"}</td>
      <td>{Number(item.totalScore ?? 0)}</td>
      <td>
        <span
          className={`status-chip status-chip--${String(item.status || "").toLowerCase()}`}
        >
          {STATUS_LABEL_MAP[item.status] || item.status || "-"}
        </span>
      </td>
      <td>{formatAssignmentDateTime(item.updatedAt || item.createdAt)}</td>
    </tr>
  );
});

AssignmentRow.displayName = "AssignmentRow";

export default AssignmentRow;
