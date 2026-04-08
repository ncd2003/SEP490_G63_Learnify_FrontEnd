import { useState, useEffect } from "react";
import { Search, ChevronRight, Calendar, Mail, User, Zap } from "lucide-react";
import { subscriptionApi } from "@/apis/subscription.api";
import useDebounce from "@/hooks/use-debounce";
import Pagination from "@/components/Pagination";
import SubscriptionDetailModal from "./subscription-detail-modal";
import { formatCurrency } from "@/lib/utils";
import "@/assets/css/pages/admin/subscriptionList.css";

const SORT_OPTIONS = [
    { value: "createdAt_DESC", label: "Mới nhất" },
    { value: "createdAt_ASC", label: "Cũ nhất" },
];

const SUBSCRIPTION_STATUS_LABELS = {
    ACTIVE: "Đang hoạt động",
    CANCELLED: "Đã hủy",
    EXPIRED: "Hết hạn",
};

const getSubscriptionStatusLabel = (status) => {
    const normalizedStatus = String(status || "").toUpperCase();
    return SUBSCRIPTION_STATUS_LABELS[normalizedStatus] || status || "UNKNOWN";
};

const AdminSubscriptionListPage = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortValue, setSortValue] = useState("createdAt_DESC");
    const [page, setPage] = useState(1);
    const [paging, setPaging] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
    });
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const debouncedSearch = useDebounce(search, 300);

    const fetchSubscriptions = async () => {
        setLoading(true);
        setError("");
        try {
            const [sortBy, sortDirection] = sortValue.split("_");
            const response = await subscriptionApi.getSubscriptions({
                page,
                size: 10,
                sortBy,
                sortDirection,
            });

            const result = response?.result ?? {};
            let content = Array.isArray(result.content) ? result.content : [];

            // Filter by search (email hoặc fullName)
            if (debouncedSearch.trim()) {
                const query = debouncedSearch.toLowerCase();
                content = content.filter(
                    (sub) =>
                        sub.user?.email?.toLowerCase().includes(query) ||
                        sub.user?.fullName?.toLowerCase().includes(query) ||
                        sub.plan?.name?.toLowerCase().includes(query)
                );
            }

            setSubscriptions(content);
            setPaging({
                pageNumber: result.pageNumber ?? page,
                pageSize: result.pageSize ?? 10,
                totalElements: result.totalElements ?? 0,
                totalPages: result.totalPages ?? 1,
            });
        } catch (err) {
            setError(err.response?.data?.message ?? "Không thể tải danh sách subscriptions.");
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [page, sortValue, debouncedSearch]);

    const handleRowClick = (subscription) => {
        setSelectedSubscription(subscription);
        setShowDetailModal(true);
    };

    const handleDetailClose = () => {
        setShowDetailModal(false);
        setTimeout(() => setSelectedSubscription(null), 300);
    };

    const formatDate = (dateString, fallback = "N/A") => {
        if (!dateString) {
            return fallback;
        }
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <div className="subscription-list-page">
            <div className="subscription-header">
                <h1>Quản lý đăng ký gói người dùng</h1>
                <p>Xem và quản lý tất cả các đăng ký của người dùng</p>
            </div>

            {/* Search và Sort */}
            <div className="subscription-toolbar">
                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo email, tên người dùng hoặc gói..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <select
                    value={sortValue}
                    onChange={(e) => setSortValue(e.target.value)}
                    className="sort-select"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* List */}
            <div className="subscription-container">
                {loading ? (
                    <div className="subscription-empty">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="subscription-empty error">{error}</div>
                ) : subscriptions.length === 0 ? (
                    <div className="subscription-empty">
                        {search ? "Không tìm thấy subscription phù hợp" : "Chưa có subscription nào"}
                    </div>
                ) : (
                    <div className="subscription-list">
                        {subscriptions.map((subscription) => (
                            <div
                                key={subscription.id}
                                className="subscription-card"
                                onClick={() => handleRowClick(subscription)}
                            >
                                <div className="subscription-card-content">
                                    <div className="subscription-main">
                                        <div className="subscription-user">
                                            <div className="subscription-avatar">
                                                {subscription.user?.fullName?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                            <div className="subscription-info">
                                                <h3 className="subscription-name">
                                                    {subscription.user?.fullName || "Không rõ"}
                                                </h3>
                                                <p className="subscription-email">
                                                    <Mail size={12} />
                                                    {subscription.user?.email || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="subscription-details">
                                            <div className="subscription-plan">
                                                <Zap size={14} />
                                                <span className="plan-name">{subscription.plan?.name || "N/A"}</span>
                                                <span className="plan-price">
                                                    {formatCurrency(Number(subscription.plan?.price ?? 0))}
                                                </span>
                                            </div>

                                            <div className="subscription-status">
                                                <span
                                                    className={`status-badge ${subscription.subscriptionStatus?.toLowerCase()}`}
                                                >
                                                    {getSubscriptionStatusLabel(subscription.subscriptionStatus)}
                                                </span>
                                            </div>

                                            <div className="subscription-date">
                                                <Calendar size={12} />
                                                <span className="subscription-date-label">BĐ:</span>
                                                {formatDate(subscription.startAt)}
                                            </div>

                                            <div className="subscription-date">
                                                <Calendar size={12} />
                                                <span className="subscription-date-label">KT:</span>
                                                {formatDate(subscription.endAt, "Không giới hạn")}
                                            </div>
                                            
                                        </div>
                                    </div>

                                    <div className="subscription-arrow">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Pagination */}
                        {subscriptions.length > 0 && (
                            <Pagination
                                page={page}
                                totalPages={paging.totalPages}
                                loading={loading}
                                onPageChange={setPage}
                            />
                        )}
                    </div>
                )}


            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedSubscription && (
                <SubscriptionDetailModal
                    subscription={selectedSubscription}
                    onClose={handleDetailClose}
                />
            )}
        </div>
    );
};

export default AdminSubscriptionListPage;
