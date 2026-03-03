import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import '@/assets/css/pages/classroom/classroomFeed.css';

const ClassroomFeed = () => {
  return (
    <ClassroomDetailLayout>
      <div className="classroom-feed-page">
        <h1 className="classroom-feed-title">Bảng tin</h1>
        <div className="classroom-feed-content">
          <p>Chào mừng bạn đến với lớp học!</p>
          <p>Nội dung bảng tin sẽ được hiển thị tại đây.</p>
        </div>
      </div>
    </ClassroomDetailLayout>
  );
};

export default ClassroomFeed;
