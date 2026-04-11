import React from "react";
import { Link } from "react-router-dom";
import { PATH_AUTH } from "@/routes/paths";

const LAST_UPDATED = "03/04/2026";

const roleVisibility = [
  {
    role: "Quản trị viên hệ thống (Admin)",
    canSee: [
      "Thông tin hồ sơ người dùng phục vụ quản trị: họ tên, email, vai trò, trạng thái tài khoản, thời điểm đăng nhập gần nhất.",
      "Nhật ký hệ thống và hoạt động kỹ thuật: thời điểm đăng nhập, địa chỉ IP, thiết bị/trình duyệt, lịch sử thao tác quản trị.",
      "Dữ liệu vận hành lớp học ở mức cần thiết để xử lý khiếu nại, kiểm tra an ninh, khắc phục sự cố hoặc tuân thủ pháp lý.",
    ],
    cannotSee: [
      "Mật khẩu gốc của người dùng (hệ thống chỉ lưu dạng mã hóa/hashed).",
      "Nội dung riêng tư ngoài phạm vi hệ thống hoặc dữ liệu không liên quan đến mục đích vận hành, bảo mật, tuân thủ.",
    ],
  },
  {
    role: "Giáo viên (Teacher)",
    canSee: [
      "Thông tin học sinh trong các lớp do giáo viên phụ trách: họ tên, email học tập, mã/tên lớp, trạng thái tham gia lớp.",
      "Dữ liệu học tập trong lớp: điểm số, bài nộp, tiến độ bài tập, lịch sử điểm danh, tương tác bài học và trao đổi liên quan lớp học.",
      "Thông báo và nội dung học tập mà học sinh nhận trong phạm vi lớp được phân công.",
    ],
    cannotSee: [
      "Dữ liệu của học sinh không thuộc lớp mình quản lý.",
      "Nhật ký quản trị hệ thống hoặc thông tin bảo mật nội bộ cấp quản trị viên.",
    ],
  },
  {
    role: "Học sinh (Student)",
    canSee: [
      "Thông tin tài khoản cá nhân của chính mình và dữ liệu học tập trong các lớp đã tham gia.",
      "Điểm số, bài tập, lịch học, thông báo, phản hồi và tiến độ học tập liên quan trực tiếp đến bản thân.",
      "Một phần thông tin thành viên lớp (ví dụ tên hiển thị) khi được hệ thống hoặc giáo viên cho phép để phục vụ học tập.",
    ],
    cannotSee: [
      "Dữ liệu học tập chi tiết của học sinh khác nếu không có quyền truy cập hợp lệ.",
      "Nhật ký hệ thống, thông tin kỹ thuật bảo mật hoặc dữ liệu quản trị nội bộ.",
    ],
  },
];

const generalSections = [
  {
    title: "1. Dữ liệu chúng tôi thu thập",
    items: [
      "Dữ liệu bạn cung cấp: họ tên, email, vai trò, thông tin hồ sơ cá nhân, nội dung học tập được tải lên hệ thống.",
      "Dữ liệu phát sinh trong quá trình sử dụng: lịch sử đăng nhập, lớp học tham gia, bài nộp, điểm số, lịch học, thông báo tương tác.",
      "Dữ liệu kỹ thuật: địa chỉ IP, loại thiết bị, trình duyệt, cookie và thông tin phiên để đảm bảo an ninh và hiệu năng.",
    ],
  },
  {
    title: "2. Mục đích sử dụng dữ liệu",
    items: [
      "Cung cấp và vận hành các chức năng học tập, quản lý lớp, đánh giá và báo cáo tiến độ.",
      "Xác thực tài khoản, bảo vệ an toàn hệ thống, ngăn chặn truy cập trái phép hoặc hành vi gian lận.",
      "Hỗ trợ người dùng, xử lý khiếu nại, nâng cao chất lượng sản phẩm và tuân thủ nghĩa vụ pháp lý.",
    ],
  },
  {
    title: "3. Chia sẻ dữ liệu",
    items: [
      "Dữ liệu được chia sẻ theo nguyên tắc tối thiểu, đúng vai trò và đúng mục đích công việc.",
      "Learnify chỉ chia sẻ dữ liệu cho bên thứ ba khi có căn cứ pháp lý, yêu cầu của cơ quan có thẩm quyền, hoặc được bạn đồng ý.",
      "Nhà cung cấp hạ tầng/kỹ thuật (nếu có) chỉ được xử lý dữ liệu trong phạm vi hợp đồng và yêu cầu bảo mật tương ứng.",
    ],
  },
  {
    title: "4. Lưu trữ và bảo mật",
    items: [
      "Dữ liệu được bảo vệ bằng các biện pháp kỹ thuật và tổ chức phù hợp như phân quyền truy cập, ghi nhận nhật ký, mã hóa khi cần thiết.",
      "Mật khẩu được lưu ở dạng mã hóa, không hiển thị dưới dạng văn bản gốc cho quản trị viên hoặc nhân sự vận hành.",
      "Thời gian lưu trữ dữ liệu phụ thuộc vào mục đích sử dụng, yêu cầu pháp lý và chính sách lưu trữ nội bộ của Learnify.",
    ],
  },
  {
    title: "5. Quyền của người dùng",
    items: [
      "Bạn có quyền yêu cầu xem, cập nhật hoặc chỉnh sửa dữ liệu cá nhân không chính xác.",
      "Bạn có quyền yêu cầu hạn chế xử lý hoặc xóa dữ liệu trong phạm vi pháp luật cho phép.",
      "Bạn có thể liên hệ bộ phận hỗ trợ để thực hiện các quyền liên quan đến quyền riêng tư.",
    ],
  },
  {
    title: "6. Cập nhật chính sách",
    items: [
      "Chính sách có thể được điều chỉnh để phản ánh thay đổi pháp lý hoặc thay đổi trong hoạt động hệ thống.",
      "Phiên bản cập nhật sẽ được công bố trên nền tảng và có hiệu lực kể từ ngày thông báo.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link to={PATH_AUTH.home} style={styles.backLink}>
            ← Về trang chủ
          </Link>
          <Link to={PATH_AUTH.register} style={styles.secondaryLink}>
            Đăng ký
          </Link>
        </div>

        <h1 style={styles.title}>Chính sách bảo mật</h1>
        <p style={styles.meta}>Ngày cập nhật: {LAST_UPDATED}</p>
        <p style={styles.lead}>
          Chính sách này giải thích Learnify thu thập, sử dụng, lưu trữ và phân
          quyền truy cập dữ liệu như thế nào.
        </p>

        <div style={styles.card}>
          {generalSections.map((section) => (
            <section key={section.title} style={styles.section}>
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              <ul style={styles.list}>
                {section.items.map((item) => (
                  <li key={item} style={styles.item}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>7. Phân quyền theo vai trò</h2>
            <p style={styles.roleIntro}>
              Dưới đây là phạm vi theo dõi/truy cập dữ liệu theo từng vai trò trên
              hệ thống:
            </p>

            {roleVisibility.map((group) => (
              <div key={group.role} style={styles.roleCard}>
                <h3 style={styles.roleTitle}>{group.role}</h3>

                <p style={styles.roleLabel}>Có thể theo dõi/truy cập:</p>
                <ul style={styles.list}>
                  {group.canSee.map((item) => (
                    <li key={item} style={styles.item}>
                      {item}
                    </li>
                  ))}
                </ul>

                <p style={styles.roleLabel}>Không thể truy cập:</p>
                <ul style={styles.list}>
                  {group.cannotSee.map((item) => (
                    <li key={item} style={styles.item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <p style={styles.contact}>
          Câu hỏi về quyền riêng tư: privacy@learnify.vn
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    padding: "32px 16px 48px",
    color: "#0f172a",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: 980,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
    flexWrap: "wrap",
  },
  backLink: {
    color: "#1d4ed8",
    fontWeight: 600,
    textDecoration: "none",
  },
  secondaryLink: {
    color: "#334155",
    textDecoration: "none",
    fontWeight: 500,
  },
  title: {
    fontSize: "clamp(28px, 4vw, 38px)",
    marginBottom: 8,
  },
  meta: {
    color: "#475569",
    marginBottom: 20,
  },
  lead: {
    lineHeight: 1.7,
    marginBottom: 22,
    color: "#1e293b",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "24px 20px",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 19,
    marginBottom: 10,
    color: "#0f172a",
  },
  list: {
    margin: 0,
    paddingLeft: 22,
  },
  item: {
    marginBottom: 8,
    lineHeight: 1.7,
    color: "#1e293b",
  },
  roleIntro: {
    color: "#334155",
    marginBottom: 14,
    lineHeight: 1.7,
  },
  roleCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px 14px",
    marginBottom: 14,
    backgroundColor: "#f8fafc",
  },
  roleTitle: {
    margin: "0 0 10px",
    fontSize: 17,
    color: "#0f172a",
  },
  roleLabel: {
    margin: "8px 0 8px",
    fontWeight: 600,
    color: "#0f172a",
  },
  contact: {
    marginTop: 20,
    color: "#334155",
  },
};
