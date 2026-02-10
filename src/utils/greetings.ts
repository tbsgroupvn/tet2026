const GREETINGS: Record<string, string[]> = {
  'Ban Giám Đốc': [
    'Chúc Ban Giám Đốc năm mới lãnh đạo TBS vươn tầm cao mới, mọi chiến lược đều thành công rực rỡ!',
    'Kính chúc Quý lãnh đạo năm mới thịnh vượng, dẫn dắt TBS Group phát triển bền vững!',
    'Chúc Ban Giám Đốc năm mới tài lộc dồi dào, quyết sách sáng suốt, công ty ngày càng lớn mạnh!',
    'Năm mới chúc Quý lãnh đạo sức khỏe vàng, trí tuệ sắc bén, đưa TBS bay cao bay xa!',
  ],
  'Phòng Nhân Sự': [
    'Chúc Phòng Nhân Sự năm mới tuyển dụng toàn nhân tài, giữ chân người giỏi, xây dựng đội ngũ vững mạnh!',
    'Năm mới chúc các anh chị HR luôn là cầu nối yêu thương, gắn kết đại gia đình TBS!',
    'Chúc Phòng Nhân Sự năm mới nhiều chính sách đột phá, nhân viên hạnh phúc, công ty phát triển!',
    'Năm mới chúc team HR tài lộc đầy nhà, công việc suôn sẻ, ai cũng yêu quý!',
  ],
  'Phòng Marketing': [
    'Chúc Phòng Marketing năm mới sáng tạo bùng nổ, campaign nào cũng viral, thương hiệu TBS tỏa sáng!',
    'Năm mới chúc team Marketing ý tưởng bay xa, content đỉnh cao, KPI vượt chỉ tiêu!',
    'Chúc các chiến binh Marketing năm mới đầy cảm hứng, mỗi chiến dịch đều là một tuyệt phẩm!',
    'Năm mới chúc Phòng Marketing reach triệu view, engagement cháy bảng, thương hiệu lên ngôi!',
  ],
  'Phòng Chăm Sóc Khách Hàng': [
    'Chúc Phòng CSKH năm mới khách hàng luôn hài lòng, 5 sao tràn ngập, dịch vụ xuất sắc!',
    'Năm mới chúc team CSKH nụ cười luôn rạng rỡ, giọng nói ngọt ngào, khách hàng mến yêu!',
    'Chúc Phòng Chăm Sóc Khách Hàng năm mới không complaint, toàn feedback tích cực!',
    'Năm mới chúc các anh chị CSKH sức khỏe dẻo dai, tinh thần lạc quan, phục vụ khách hàng tận tâm!',
  ],
  'Phòng Kinh Doanh': [
    'Chúc Phòng Kinh Doanh năm mới chốt deal mỏi tay, doanh số phá kỷ lục, hoa hồng đếm không xuể!',
    'Năm mới chúc team Sales đơn hàng nối tiếp đơn hàng, khách hàng xếp hàng ký hợp đồng!',
    'Chúc chiến binh Kinh Doanh năm mới mở rộng thị trường, đối tác tin tưởng, doanh thu bùng nổ!',
    'Năm mới chúc Phòng Kinh Doanh gặp toàn khách VIP, ký hợp đồng liên tục, thưởng Tết đầy túi!',
  ],
  'Phòng Xuất Nhập Khẩu': [
    'Chúc Phòng XNK năm mới hàng thông quan nhanh, tàu cập bến đúng hẹn, nghiệp vụ trơn tru!',
    'Năm mới chúc team Xuất Nhập Khẩu shipment suôn sẻ, không delay, không phát sinh chi phí!',
    'Chúc Phòng XNK năm mới C/O nhanh gọn, thuế ưu đãi, hàng hóa lưu thông thuận lợi!',
    'Năm mới chúc các anh chị XNK container đầy hàng, đối tác quốc tế tin cậy, xuất khẩu tăng trưởng!',
  ],
  'Bộ Phận Kho': [
    'Chúc Bộ Phận Kho năm mới hàng vào đều, hàng ra nhanh, tồn kho luôn chuẩn xác!',
    'Năm mới chúc team Kho kiểm kê khớp 100%, sắp xếp gọn gàng, xuất nhập thần tốc!',
    'Chúc Bộ Phận Kho năm mới an toàn lao động, không hao hụt, kho bãi ngăn nắp!',
    'Năm mới chúc anh chị em Kho sức khỏe dồi dào, công việc nhẹ nhàng, lương thưởng xứng đáng!',
  ],
  'Bộ Phận Bán Hàng Senliving': [
    'Chúc team Senliving năm mới bán hàng đắt như tôm tươi, khách mua liên tục, doanh số top 1!',
    'Năm mới chúc Bộ Phận Senliving showroom lúc nào cũng đông khách, sản phẩm ra là hết!',
    'Chúc anh chị em Senliving năm mới tư vấn đỉnh cao, khách hàng hài lòng, đơn hàng ùn ùn!',
    'Năm mới chúc team Senliving mỗi ngày đều là ngày vui, khách yêu thương hiệu, doanh thu vượt mong đợi!',
  ],
};

const GENERIC_GREETINGS = [
  'Chúc bạn năm mới vạn sự như ý, tài lộc đầy nhà!',
  'Năm mới chúc bạn sức khỏe, hạnh phúc và thành công!',
  'Chúc năm mới an khang thịnh vượng, phúc lộc song toàn!',
  'Năm mới chúc bạn gặp nhiều may mắn, công việc thuận lợi!',
  'TBS Group - Đoàn kết, Sáng tạo, Phát triển! Chúc bạn năm mới thắng lợi!',
  'Tự hào là thành viên TBS Group! Chúc năm mới vạn sự hanh thông!',
];

export function getGreeting(department: string): string {
  const deptGreetings = GREETINGS[department];
  if (deptGreetings && deptGreetings.length > 0) {
    return deptGreetings[Math.floor(Math.random() * deptGreetings.length)];
  }
  return GENERIC_GREETINGS[Math.floor(Math.random() * GENERIC_GREETINGS.length)];
}
