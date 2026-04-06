import React from "react";
import { Link } from "react-router-dom";
import { PATH_AUTH } from "@/routes/paths";

const LAST_UPDATED = "03/04/2026";

const sections = [
  {
    title: "1. Phạm vi áp dụng",
    items: [
      "Điều khoản này điều chỉnh việc sử dụng nền tảng Learnify, bao gồm website, ứng dụng và các dịch vụ liên quan.",
      "Khi tạo tài khoản hoặc tiếp tục sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản bên dưới.",
    ],
  },
  {
    title: "2. Tài khoản và trách nhiệm người dùng",
    items: [
      "Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản.",
      "Bạn tự chịu trách nhiệm bảo mật tài khoản, mật khẩu và mọi hoạt động phát sinh từ tài khoản của mình.",
      "Bạn phải thông báo ngay cho Learnify khi phát hiện truy cập trái phép hoặc rò rỉ thông tin đăng nhập.",
    ],
  },
  {
    title: "3. Quy tắc sử dụng",
    items: [
      "Không được sử dụng hệ thống cho mục đích gian lận, phát tán mã độc, quấy rối hoặc vi phạm pháp luật.",
      "Không được đăng tải nội dung xâm phạm bản quyền, danh dự, quyền riêng tư hoặc các quyền hợp pháp của tổ chức/cá nhân khác.",
      "Không được tìm cách truy cập trái phép vào dữ liệu, tài nguyên hoặc chức năng không được phân quyền.",
    ],
  },
  {
    title: "4. Nội dung học tập và sở hữu trí tuệ",
    items: [
      "Nội dung do giáo viên hoặc nhà trường đăng tải thuộc quyền sở hữu của bên tạo nội dung, trừ khi có thỏa thuận khác bằng văn bản.",
      "Learnify được quyền lưu trữ, xử lý và hiển thị nội dung trong phạm vi cần thiết để vận hành dịch vụ.",
      "Nghiêm cấm sao chép, phân phối hoặc thương mại hóa trái phép tài liệu học tập trên hệ thống.",
    ],
  },
  {
    title: "5. Quản trị hệ thống và quyền can thiệp",
    items: [
      "Learnify có quyền giám sát vận hành, rà soát nhật ký hệ thống và tạm thời giới hạn truy cập khi có dấu hiệu rủi ro bảo mật hoặc vi phạm điều khoản.",
      "Quản trị viên có thể thực hiện hành động kỹ thuật cần thiết như khóa/mở tài khoản, xử lý báo cáo vi phạm hoặc khôi phục dữ liệu theo chính sách nội bộ.",
      "Mọi hành động quản trị phải tuân thủ Chính sách bảo mật và nguyên tắc tối thiểu quyền truy cập.",
    ],
  },
  {
    title: "6. Tạm ngưng, chấm dứt dịch vụ",
    items: [
      "Learnify có thể tạm ngưng hoặc chấm dứt tài khoản nếu người dùng vi phạm điều khoản hoặc gây ảnh hưởng đến an toàn hệ thống.",
      "Người dùng có thể ngừng sử dụng dịch vụ bất kỳ lúc nào; dữ liệu sẽ được xử lý theo Chính sách bảo mật và quy định pháp luật hiện hành.",
    ],
  },
  {
    title: "7. Miễn trừ và giới hạn trách nhiệm",
    items: [
      "Learnify nỗ lực duy trì tính sẵn sàng và chính xác của hệ thống, nhưng không đảm bảo dịch vụ luôn liên tục, không lỗi trong mọi thời điểm.",
      "Learnify không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc người dùng vi phạm điều khoản, chia sẻ tài khoản, hoặc sử dụng trái hướng dẫn.",
    ],
  },
  {
    title: "8. Cập nhật điều khoản",
    items: [
      "Learnify có thể cập nhật điều khoản để phù hợp với thay đổi pháp lý hoặc vận hành.",
      "Phiên bản mới có hiệu lực từ ngày công bố trên hệ thống. Việc tiếp tục sử dụng dịch vụ sau thời điểm cập nhật được xem là chấp thuận nội dung mới.",
    ],
  },
];

export default function TermsOfService() {
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

        <h1 style={styles.title}>Điều khoản dịch vụ</h1>
        <p style={styles.meta}>Ngày cập nhật: {LAST_UPDATED}</p>

        <p style={styles.lead}>
          Điều khoản dịch vụ quy định quyền và nghĩa vụ của người dùng khi truy
          cập hoặc sử dụng Learnify.
        </p>

        <div style={styles.card}>
          {sections.map((section) => (
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
        </div>

        <p style={styles.contact}>
          Nếu cần hỗ trợ, vui lòng liên hệ: support@learnify.vn
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
    marginBottom: 20,
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
  contact: {
    marginTop: 20,
    color: "#334155",
  },
};
