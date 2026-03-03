import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import "@/assets/css/pages/home.css";
import {
  BookOpen,
  Play,
  Star,
  Users,
  Award,
  Clock,
  TrendingUp,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react";

const Homepage = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      icon: FileText,
      title: "Quản lý bài tập",
      description:
        "Tạo và phân phối bài tập, theo dõi tiến độ nộp bài của học sinh.",
      color: "#3b82f6",
    },
    {
      id: 2,
      icon: Users,
      title: "Quản lý lớp học",
      description: "Tổ chức lớp học, điểm danh và quản lý thông tin học sinh.",
      color: "#10b981",
    },
    {
      id: 3,
      icon: TrendingUp,
      title: "Báo cáo & Thống kê",
      description: "Xem báo cáo chi tiết về điểm số và tiến độ học tập.",
      color: "#f59e0b",
    },
    {
      id: 4,
      icon: Calendar,
      title: "Lịch & Nhắc nhở",
      description: "Lên lịch giảng dạy, deadline bài tập và nhận thông báo.",
      color: "#8b5cf6",
    },
  ];

  const stats = [
    { number: "5,000+", label: "Giáo viên", icon: Users },
    { number: "50,000+", label: "Học sinh", icon: BookOpen },
    { number: "15,000+", label: "Lớp học", icon: Award },
    { number: "98%", label: "Hài lòng", icon: Star },
  ];

  const testimonials = [
    {
      name: "Nguyễn Thị Mai",
      role: "Giáo viên Toán - THPT Lê Quý Đôn",
      avatar: "NM",
      content:
        "Learnify giúp tôi tiết kiệm thời gian quản lý lớp học. Tôi có thể tập trung hơn vào giảng dạy và hỗ trợ học sinh.",
      rating: 5,
    },
    {
      name: "Trần Văn Hùng",
      role: "Giáo viên Lý - THCS Trần Phú",
      avatar: "TH",
      content:
        "Quản lý bài tập và chấm điểm chưa bao giờ dễ dàng đến thế. Học sinh phụ huynh cũng rất hài lòng với sự minh bạch.",
      rating: 5,
    },
    {
      name: "Lê Thị Hương",
      role: "Giáo viên Tiếng Anh - THPT Chu Văn An",
      avatar: "LH",
      content:
        "Tính năng báo cáo giúp tôi nắm rõ tiến độ từng học sinh. Tôi có thể hỗ trợ kịp thời những em còn yếu.",
      rating: 5,
    },
  ];

  return (
    <div className="homepage">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <TrendingUp size={16} />
                <span>Được 5,000+ giáo viên tin dùng</span>
              </div>

              <h1 className="hero-title">
                Quản lý lớp học
                <span className="gradient-text">
                  {" "}
                  hiệu quả, giảng dạy tự tin
                </span>
              </h1>

              <p className="hero-description">
                Nền tảng quản lý lớp học toàn diện dành cho giáo viên. Tiết kiệm
                thời gian, nâng cao chất lượng giảng dạy với Learnify.
              </p>

              <div className="hero-cta">
                <button className="btn-hero-primary">Bắt đầu miễn phí</button>
                <button className="btn-hero-secondary">
                  <Play size={20} />
                  Xem demo
                </button>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <Clock size={20} className="stat-icon" />
                  <span>Tiết kiệm 70% thời gian</span>
                </div>
                <div className="stat-item">
                  <Users size={20} className="stat-icon" />
                  <span>Quản lý không giới hạn lớp</span>
                </div>
                <div className="stat-item">
                  <Award size={20} className="stat-icon" />
                  <span>Miễn phí 30 ngày</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-card card-1">
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <div className="card-title">Lớp 10A1</div>
                  <div className="card-stat">38 học sinh</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <div className="card-desc">Điểm danh hôm nay: 36/38</div>
                </div>
              </div>

              <div className="visual-card card-2">
                <div className="card-icon">📝</div>
                <div className="card-content">
                  <div className="card-title">Bài tập tuần 12</div>
                  <div className="card-stat">28/38 đã nộp</div>
                  <div className="card-deadline">Hạn: 2 ngày nữa</div>
                </div>
              </div>

              <div className="visual-card card-3">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <div className="card-title">Điểm trung bình</div>
                  <div className="achievement-badges">
                    <div className="grade-item">
                      <span className="grade">8.5</span>
                      <span className="subject">Toán</span>
                    </div>
                    <div className="grade-item">
                      <span className="grade">7.8</span>
                      <span className="subject">Lý</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <stat.icon className="stat-card-icon" size={32} />
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tính năng nổi bật</h2>
            <p className="section-subtitle">
              Mọi thứ bạn cần để quản lý lớp học hiệu quả
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.id} className="feature-card">
                  <div
                    className="feature-icon-wrapper"
                    style={{ background: `${feature.color}15` }}
                  >
                    <IconComponent
                      className="feature-icon"
                      size={32}
                      style={{ color: feature.color }}
                    />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="howitworks-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Cách thức hoạt động</h2>
            <p className="section-subtitle">Chỉ 3 bước đơn giản để bắt đầu</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Tạo lớp học</h3>
                <p className="step-description">
                  Thiết lập lớp học của bạn với tên, môn học và thông tin cơ
                  bản. Mời học sinh tham gia qua mã lớp hoặc email.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Quản lý nội dung</h3>
                <p className="step-description">
                  Đăng tài liệu, tạo bài tập, lên lịch kiểm tra. Theo dõi tiến
                  độ nộp bài và chấm điểm dễ dàng.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Theo dõi & Đánh giá</h3>
                <p className="step-description">
                  Xem báo cáo chi tiết về kết quả học tập, điểm danh, và tương
                  tác với học sinh, phụ huynh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Học viên nói gì về chúng tôi</h2>
            <p className="section-subtitle">
              Câu chuyện thành công từ cộng đồng giáo viên
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" stroke="#f59e0b" />
                  ))}
                </div>

                <p className="testimonial-content">"{testimonial.content}"</p>

                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div>
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Sẵn sàng nâng tầm chất lượng giảng dạy?
            </h2>
            <p className="cta-description">
              Tham gia cùng 5,000+ giáo viên đang sử dụng Learnify để quản lý
              lớp học hiệu quả hơn
            </p>
            <div className="cta-buttons">
              <button className="btn-cta-primary">
                Dùng thử miễn phí 30 ngày
              </button>
              <button className="btn-cta-secondary">Liên hệ tư vấn</button>
            </div>
            <p className="cta-note">
              ✓ Không cần thẻ tín dụng • ✓ Hủy bất cứ lúc nào
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <div className="footer-logo">
                <BookOpen size={28} strokeWidth={2.5} />
                <span>Learnify</span>
              </div>
              <p className="footer-description">
                Nền tảng học trực tuyến hàng đầu Việt Nam. Nơi tri thức không có
                giới hạn.
              </p>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Sản phẩm</h4>
              <a href="#" className="footer-link">
                Tính năng
              </a>
              <a href="#" className="footer-link">
                Bảng giá
              </a>
              <a href="#" className="footer-link">
                Tích hợp
              </a>
              <a href="#" className="footer-link">
                Doanh nghiệp
              </a>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Hỗ trợ</h4>
              <a href="#" className="footer-link">
                Trung tâm trợ giúp
              </a>
              <a href="#" className="footer-link">
                Hướng dẫn sử dụng
              </a>
              <a href="#" className="footer-link">
                Điều khoản
              </a>
              <a href="#" className="footer-link">
                Chính sách
              </a>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Cộng đồng</h4>
              <a href="#" className="footer-link">
                Blog giáo viên
              </a>
              <a href="#" className="footer-link">
                Facebook
              </a>
              <a href="#" className="footer-link">
                LinkedIn
              </a>
              <a href="#" className="footer-link">
                YouTube
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Learnify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
