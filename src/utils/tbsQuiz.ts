export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // index of correct answer
  explanation: string;
  category: 'culture' | 'service' | 'value' | 'team' | 'tet';
  coins: number;
}

// Câu hỏi về văn hóa, dịch vụ, giá trị cốt lõi TBS Group
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // === GIÁ TRỊ CỐT LÕI ===
  {
    id: 1,
    question: 'Giá trị cốt lõi nào được TBS Group đặt lên hàng đầu trong mọi hoạt động kinh doanh?',
    options: ['Lợi nhuận tối đa', 'Chất lượng & Uy tín', 'Mở rộng quy mô', 'Cạnh tranh giá'],
    correct: 1,
    explanation: 'TBS Group luôn đặt Chất lượng & Uy tín lên hàng đầu - đó là nền tảng xây dựng niềm tin với khách hàng và đối tác.',
    category: 'value',
    coins: 20,
  },
  {
    id: 2,
    question: 'Phòng ban nào chịu trách nhiệm chính về nghiệp vụ thông quan và vận chuyển quốc tế tại TBS Group?',
    options: ['Phòng Kinh Doanh', 'Bộ Phận Kho', 'Phòng Xuất Nhập Khẩu', 'Phòng Marketing'],
    correct: 2,
    explanation: 'Phòng Xuất Nhập Khẩu đảm nhận nghiệp vụ thông quan, chứng từ C/O, và điều phối vận chuyển hàng hóa quốc tế.',
    category: 'team',
    coins: 15,
  },
  {
    id: 3,
    question: 'Senliving là thương hiệu của TBS Group chuyên về lĩnh vực nào?',
    options: ['Thực phẩm', 'Nội thất & Đồ gia dụng', 'Thời trang', 'Công nghệ'],
    correct: 1,
    explanation: 'Senliving là thương hiệu bán lẻ của TBS Group trong lĩnh vực nội thất và đồ gia dụng, mang đến sản phẩm chất lượng cho gia đình Việt.',
    category: 'service',
    coins: 20,
  },
  {
    id: 4,
    question: 'Tinh thần "Đoàn kết - Sáng tạo - Phát triển" thể hiện điều gì trong văn hóa TBS?',
    options: [
      'Chỉ là khẩu hiệu treo tường',
      'Kim chỉ nam hành động của toàn bộ nhân viên',
      'Quy định của phòng HR',
      'Slogan quảng cáo sản phẩm',
    ],
    correct: 1,
    explanation: 'Đây là kim chỉ nam hành động - mỗi thành viên TBS đều đoàn kết hỗ trợ nhau, sáng tạo trong công việc và cùng phát triển.',
    category: 'culture',
    coins: 20,
  },
  {
    id: 5,
    question: 'Bộ phận nào đóng vai trò quan trọng trong việc quản lý, kiểm kê và xuất nhập hàng hóa?',
    options: ['Phòng Marketing', 'Phòng Nhân Sự', 'Bộ Phận Kho', 'Ban Giám Đốc'],
    correct: 2,
    explanation: 'Bộ Phận Kho chịu trách nhiệm quản lý tồn kho, kiểm kê, sắp xếp hàng hóa và đảm bảo xuất nhập nhanh chóng, chính xác.',
    category: 'team',
    coins: 15,
  },
  {
    id: 6,
    question: 'Tại TBS Group, dịch vụ Chăm Sóc Khách Hàng hướng đến tiêu chí nào?',
    options: [
      'Trả lời nhanh nhất có thể',
      'Tận tâm - Chuyên nghiệp - Hài lòng 100%',
      'Chỉ hỗ trợ trong giờ hành chính',
      'Ưu tiên khách VIP',
    ],
    correct: 1,
    explanation: 'Phòng CSKH của TBS luôn hướng đến sự tận tâm, chuyên nghiệp và đảm bảo khách hàng hài lòng 100% với dịch vụ.',
    category: 'service',
    coins: 20,
  },
  {
    id: 7,
    question: 'Phòng Kinh Doanh tại TBS Group đóng vai trò gì trong chuỗi giá trị?',
    options: [
      'Chỉ bán hàng',
      'Là cầu nối giữa sản phẩm/dịch vụ với khách hàng và đối tác',
      'Chỉ tìm kiếm khách hàng mới',
      'Quản lý kho hàng',
    ],
    correct: 1,
    explanation: 'Phòng Kinh Doanh là cầu nối quan trọng, không chỉ bán hàng mà còn xây dựng quan hệ đối tác, mở rộng thị trường và phát triển kinh doanh bền vững.',
    category: 'team',
    coins: 15,
  },
  {
    id: 8,
    question: 'Văn hóa làm việc nhóm tại TBS Group được thể hiện qua điều gì?',
    options: [
      'Mỗi người làm việc độc lập',
      'Phối hợp liên phòng ban, hỗ trợ lẫn nhau vì mục tiêu chung',
      'Chỉ làm việc trong phòng ban mình',
      'Cạnh tranh giữa các phòng ban',
    ],
    correct: 1,
    explanation: 'TBS Group đề cao tinh thần làm việc nhóm - các phòng ban phối hợp chặt chẽ, hỗ trợ lẫn nhau để đạt mục tiêu chung của công ty.',
    category: 'culture',
    coins: 20,
  },
  {
    id: 9,
    question: 'Phòng Marketing tại TBS Group có nhiệm vụ chính nào?',
    options: [
      'Chỉ chạy quảng cáo Facebook',
      'Xây dựng thương hiệu, truyền thông và phát triển chiến lược marketing tổng thể',
      'Thiết kế logo',
      'Quản lý website',
    ],
    correct: 1,
    explanation: 'Phòng Marketing chịu trách nhiệm xây dựng và phát triển thương hiệu TBS Group & Senliving, triển khai chiến lược marketing đa kênh.',
    category: 'team',
    coins: 15,
  },
  {
    id: 10,
    question: 'Phòng Nhân Sự TBS Group ngoài tuyển dụng còn đảm nhận nhiệm vụ quan trọng nào?',
    options: [
      'Chỉ tuyển dụng',
      'Xây dựng văn hóa doanh nghiệp, đào tạo phát triển nhân tài, gắn kết nhân viên',
      'Quản lý tài chính',
      'Bán hàng',
    ],
    correct: 1,
    explanation: 'Phòng Nhân Sự là trái tim của tổ chức - xây dựng văn hóa, đào tạo nhân tài, tổ chức hoạt động gắn kết và chăm lo đời sống nhân viên.',
    category: 'team',
    coins: 15,
  },
  // === 3 VĂN HÓA DOANH NGHIỆP HÙNG MẠNH (GS Phan Văn Trường) ===
  {
    id: 21,
    question: 'Theo GS Phan Văn Trường, "Sếp" trong một doanh nghiệp hùng mạnh là ai?',
    options: [
      'Tổng Giám Đốc',
      'Lợi ích tối đa của công ty',
      'Người có nhiều cổ phiếu nhất',
      'Trưởng phòng ban',
    ],
    correct: 1,
    explanation: 'Trong Văn hóa Bình đẳng, lợi ích tối đa của công ty chính là "Sếp" — mọi quyết định đều phải dựa trên 100% lợi ích chung, bất kể vị trí.',
    category: 'culture',
    coins: 25,
  },
  {
    id: 22,
    question: 'Văn hóa Bình đẳng trong doanh nghiệp hùng mạnh thể hiện qua điều gì?',
    options: [
      'Ai cũng có lương bằng nhau',
      'Dù ở vị trí nào cũng phải đi theo lợi ích tối đa của công ty',
      'Mọi người đều là sếp',
      'Không có cấp bậc trong công ty',
    ],
    correct: 1,
    explanation: 'Văn hóa Bình đẳng có nghĩa mọi người — từ lãnh đạo cao nhất đến nhân viên — đều cùng đi trên một con thuyền, hướng về một chí hướng và chiến lược chung.',
    category: 'culture',
    coins: 25,
  },
  {
    id: 23,
    question: 'Văn hóa Báo cáo theo GS Phan Văn Trường là gì?',
    options: [
      'Nhân viên gửi báo cáo cho sếp mỗi tuần',
      'Truyền thông toàn diện — tất cả mọi người cùng nhận thông tin, báo cáo cho nhau',
      'Chỉ báo cáo khi có vấn đề',
      'Sếp thông báo quyết định cho nhân viên',
    ],
    correct: 1,
    explanation: 'Văn hóa Báo cáo là truyền thông toàn diện theo thời gian thật. Cả công ty đều biết chuyện xảy ra, mỗi người đều chia sẻ và đóng góp phiên bản tốt nhất cho khách hàng.',
    category: 'culture',
    coins: 25,
  },
  {
    id: 24,
    question: 'Tại sao Văn hóa Báo cáo toàn diện giúp công ty phát triển nhanh?',
    options: [
      'Vì sếp kiểm soát mọi thứ',
      'Vì ai cũng biết chuyện xảy ra, cả công ty đóng góp phiên bản tốt nhất',
      'Vì nhân viên sợ bị phạt',
      'Vì có nhiều cuộc họp hơn',
    ],
    correct: 1,
    explanation: 'Khi tất cả tập thể cùng chia sẻ thông tin, mỗi cá nhân đóng góp quan điểm riêng — cả tích cực lẫn điều cần cải thiện — giúp công ty phát triển toàn diện.',
    category: 'culture',
    coins: 20,
  },
  {
    id: 25,
    question: '"Nice and Professional" — Ôn hòa và Chuyên nghiệp — có nghĩa là gì?',
    options: [
      'Luôn cười nói vui vẻ',
      'Dùng lý trí giải quyết vấn đề, làm việc tốt nhất có thể mà không gắt gỏng',
      'Mặc đồ đẹp đi làm',
      'Không bao giờ phản đối ý kiến người khác',
    ],
    correct: 1,
    explanation: 'Ôn hòa là dùng lý trí thay vì cảm xúc. Chuyên nghiệp là luôn theo đuổi chất lượng cao nhất, không hời hợt. Kết hợp cả hai tạo nên môi trường tích cực và sáng tạo.',
    category: 'culture',
    coins: 25,
  },
  {
    id: 26,
    question: 'Theo GS Phan Văn Trường, 3 văn hóa tạo nên doanh nghiệp hùng mạnh là gì?',
    options: [
      'Văn hóa cạnh tranh, Văn hóa lợi nhuận, Văn hóa mệnh lệnh',
      'Văn hóa Bình đẳng, Văn hóa Báo cáo, Văn hóa Ôn hòa & Chuyên nghiệp',
      'Văn hóa kỷ luật, Văn hóa phạt, Văn hóa thưởng',
      'Văn hóa doanh thu, Văn hóa tiết kiệm, Văn hóa mở rộng',
    ],
    correct: 1,
    explanation: 'Ba trụ cột văn hóa: Bình đẳng (lợi ích công ty là sếp), Báo cáo (truyền thông toàn diện), và Ôn hòa & Chuyên nghiệp (Nice and Professional).',
    category: 'culture',
    coins: 30,
  },
  {
    id: 27,
    question: 'Vì sao người vừa ôn hòa vừa chuyên nghiệp sẽ phát triển rất nhanh?',
    options: [
      'Vì được sếp yêu quý',
      'Vì họ vừa làm việc khách quan, xuất sắc mà vẫn duy trì tinh thần tích cực, sáng tạo',
      'Vì ít bị stress',
      'Vì không ai dám phản đối họ',
    ],
    correct: 1,
    explanation: 'Kết hợp ôn hòa (lý trí, bình tĩnh) với chuyên nghiệp (không hời hợt, theo đuổi hoàn hảo) tạo nên con người vừa giỏi vừa dễ hợp tác — chìa khóa thành công.',
    category: 'culture',
    coins: 25,
  },
  {
    id: 28,
    question: 'Trong Văn hóa Bình đẳng, lãnh đạo cấp cao ân cần với nhân viên vì lý do gì?',
    options: [
      'Vì muốn nhân viên làm thêm giờ',
      'Vì họ đi trên cùng một con thuyền, hướng về cùng một chiến lược',
      'Vì quy định công ty bắt buộc',
      'Vì sợ nhân viên nghỉ việc',
    ],
    correct: 1,
    explanation: 'Khi mọi người cùng hướng về lợi ích tối đa của công ty, lãnh đạo và nhân viên là đồng đội trên cùng một con thuyền — sự ân cần là tự nhiên, không gượng ép.',
    category: 'culture',
    coins: 20,
  },
  // === TẾT & VĂN HÓA ===
  {
    id: 11,
    question: 'Năm 2026 theo Âm lịch là năm con gì?',
    options: ['Rồng', 'Rắn', 'Ngựa', 'Dê'],
    correct: 1,
    explanation: 'Năm 2026 là năm Bính Ngọ - năm con Rắn (Tỵ), biểu tượng của sự thông thái và may mắn.',
    category: 'tet',
    coins: 10,
  },
  {
    id: 12,
    question: 'Truyền thống Tết nào thể hiện tinh thần đoàn kết gia đình, giống như văn hóa TBS?',
    options: ['Đi du lịch', 'Sum họp gia đình, cùng nhau gói bánh chưng', 'Mua sắm online', 'Ngủ nướng cả ngày'],
    correct: 1,
    explanation: 'Giống như tinh thần đoàn kết tại TBS, Tết là dịp cả gia đình sum họp, cùng nhau chuẩn bị và chia sẻ niềm vui.',
    category: 'tet',
    coins: 10,
  },
  {
    id: 13,
    question: 'TBS Group mong muốn mỗi nhân viên phát triển theo hướng nào?',
    options: [
      'Chỉ hoàn thành KPI',
      'Phát triển toàn diện: kỹ năng chuyên môn, kỹ năng mềm và giá trị cá nhân',
      'Làm thêm giờ nhiều nhất',
      'Chỉ cần có mặt đúng giờ',
    ],
    correct: 1,
    explanation: 'TBS Group đầu tư phát triển con người toàn diện - không chỉ chuyên môn mà còn kỹ năng mềm, tư duy và giá trị sống.',
    category: 'value',
    coins: 20,
  },
  {
    id: 14,
    question: 'Sự khác biệt của TBS Group so với đối thủ cạnh tranh là gì?',
    options: [
      'Giá rẻ nhất thị trường',
      'Sự tận tâm với khách hàng, chất lượng sản phẩm và dịch vụ hậu mãi chu đáo',
      'Quảng cáo nhiều nhất',
      'Có nhiều chi nhánh nhất',
    ],
    correct: 1,
    explanation: 'TBS Group tạo sự khác biệt bằng sự tận tâm, chất lượng sản phẩm đảm bảo và dịch vụ hậu mãi chu đáo, tạo niềm tin bền vững.',
    category: 'value',
    coins: 20,
  },
  {
    id: 15,
    question: 'Khi gặp khó khăn trong công việc, văn hóa TBS khuyến khích nhân viên làm gì?',
    options: [
      'Tự giải quyết một mình',
      'Chủ động trao đổi, phối hợp với đồng nghiệp và cấp trên để cùng tìm giải pháp',
      'Chờ ai đó giúp',
      'Bỏ qua vấn đề',
    ],
    correct: 1,
    explanation: 'Văn hóa TBS đề cao tinh thần chủ động - gặp khó khăn hãy chia sẻ, phối hợp và cùng nhau tìm giải pháp tốt nhất.',
    category: 'culture',
    coins: 20,
  },
  {
    id: 16,
    question: 'Hoạt động nào thể hiện TBS Group quan tâm đến đời sống tinh thần nhân viên?',
    options: [
      'Tăng ca không lương',
      'Tổ chức game Tết, teambuilding, sinh nhật, các hoạt động gắn kết',
      'Họp nhiều hơn',
      'Giảm thời gian nghỉ trưa',
    ],
    correct: 1,
    explanation: 'TBS Group thường xuyên tổ chức các hoạt động gắn kết như game Tết (như chương trình này!), teambuilding, sinh nhật, và nhiều hoạt động văn hóa khác.',
    category: 'culture',
    coins: 15,
  },
  {
    id: 17,
    question: 'Khách hàng của Senliving chủ yếu tìm kiếm điều gì?',
    options: [
      'Hàng giá rẻ nhất',
      'Sản phẩm nội thất & gia dụng chất lượng, thiết kế đẹp, giá hợp lý',
      'Hàng nhập khẩu đắt tiền',
      'Chỉ mua online',
    ],
    correct: 1,
    explanation: 'Senliving phục vụ khách hàng tìm kiếm sản phẩm nội thất & gia dụng chất lượng tốt, thiết kế hiện đại với mức giá hợp lý.',
    category: 'service',
    coins: 15,
  },
  {
    id: 18,
    question: 'Trong chuỗi cung ứng của TBS Group, quy trình XNK đóng vai trò gì?',
    options: [
      'Không quan trọng',
      'Là mắt xích then chốt đưa sản phẩm từ nhà sản xuất quốc tế đến tay khách hàng Việt Nam',
      'Chỉ lo giấy tờ',
      'Chỉ vận chuyển nội địa',
    ],
    correct: 1,
    explanation: 'Phòng XNK là mắt xích then chốt trong chuỗi cung ứng - đảm bảo hàng hóa được nhập khẩu nhanh chóng, đúng quy định và tối ưu chi phí.',
    category: 'service',
    coins: 20,
  },
  {
    id: 19,
    question: 'Câu nói nào phản ánh đúng nhất tinh thần làm việc tại TBS Group?',
    options: [
      '"Mạnh ai nấy làm"',
      '"Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao"',
      '"Nước đến chân mới nhảy"',
      '"Ai khéo thì dùng"',
    ],
    correct: 1,
    explanation: 'TBS Group tin rằng sức mạnh tập thể tạo nên thành công. Khi mọi người đoàn kết, không gì là không thể!',
    category: 'value',
    coins: 15,
  },
  {
    id: 20,
    question: 'Ban Giám Đốc TBS Group mong muốn xây dựng công ty thành gì?',
    options: [
      'Công ty lớn nhất Việt Nam',
      'Một đại gia đình gắn kết, nơi mọi người phát triển và tự hào khi là thành viên',
      'Nơi làm việc 24/7',
      'Công ty nhiều nhân viên nhất',
    ],
    correct: 1,
    explanation: 'Ban Giám Đốc mong TBS là đại gia đình gắn kết - nơi mỗi nhân viên được phát triển, được trân trọng và tự hào là thành viên TBS.',
    category: 'value',
    coins: 20,
  },
];

// 3 Văn hóa tạo nên doanh nghiệp hùng mạnh — GS Phan Văn Trường
export const TBS_THREE_CULTURES = [
  {
    icon: '⚖️',
    title: 'Văn Hóa Bình Đẳng',
    subtitle: 'Lợi ích tối đa của công ty là Sếp',
    desc: 'Mọi quyết định đều dựa trên lợi ích tối đa của công ty — dù bạn ở vị trí nào cũng đi theo cùng một lộ trình, một chiến lược mà tất cả đồng tình.',
    detail: 'Văn hóa bình đẳng giúp nhân viên thoải mái vì mọi người cùng làm việc trên một tiêu chuẩn chung. Lãnh đạo cấp cao ân cần với nhân viên vì họ đi trên cùng một con thuyền. Ngay cả người có 100% cổ phiếu cũng không có quyền tự quyết nếu đi ngược lợi ích chung.',
  },
  {
    icon: '📢',
    title: 'Văn Hóa Báo Cáo',
    subtitle: 'Truyền thông toàn diện, kịp thời',
    desc: 'Tất cả mọi người cùng nhận thông tin một lúc — ai cũng báo cáo và chia sẻ để cả công ty hiểu công việc đang đi về đâu.',
    detail: 'Không chỉ báo cáo lên cấp trên mà là truyền thông toàn diện theo thời gian thật. Mỗi cá nhân đóng góp cảm nhận riêng, phản ánh tích cực hoặc điều cần cải thiện. Công ty phát triển nhanh vì cả tập thể đóng góp phiên bản tốt nhất cho khách hàng.',
  },
  {
    icon: '🎯',
    title: 'Văn Hóa Ôn Hòa & Chuyên Nghiệp',
    subtitle: 'Nice and Professional',
    desc: 'Ôn hòa là dùng lý trí thay vì cảm xúc. Chuyên nghiệp là làm việc tốt nhất, không bao giờ hời hợt — kết hợp cả hai tạo nên sự xuất sắc.',
    detail: 'Người ôn hòa tạo môi trường dễ chịu, người chuyên nghiệp theo đuổi sự hoàn hảo. Ai làm được cả hai sẽ phát triển rất nhanh vì vừa khách quan, chuyên nghiệp mà vẫn duy trì tinh thần tích cực, sáng tạo.',
  },
];

// Core values for display
export const TBS_CORE_VALUES = [
  { icon: '⚖️', title: 'Bình Đẳng', desc: 'Lợi ích tối đa của công ty là Sếp — mọi người cùng một tiêu chuẩn, một lộ trình' },
  { icon: '📢', title: 'Báo Cáo Kịp Thời', desc: 'Truyền thông toàn diện — ai cũng chia sẻ, ai cũng nắm bắt thông tin' },
  { icon: '🎯', title: 'Ôn Hòa & Chuyên Nghiệp', desc: 'Dùng lý trí, làm việc xuất sắc, không hời hợt, không gắt gỏng' },
  { icon: '🤝', title: 'Đoàn Kết', desc: 'Phối hợp liên phòng ban, hỗ trợ lẫn nhau như một gia đình' },
  { icon: '💡', title: 'Sáng Tạo', desc: 'Luôn tìm kiếm giải pháp mới, cải tiến quy trình làm việc' },
  { icon: '❤️', title: 'Tận Tâm', desc: 'Phục vụ khách hàng bằng cả trái tim và sự chuyên nghiệp' },
];

export const CULTURE_TIPS = [
  '⚖️ Văn hóa Bình đẳng: Lợi ích tối đa của công ty là Sếp — dù bạn ở vị trí nào cũng đi theo cùng một lộ trình!',
  '📢 Văn hóa Báo cáo: Tất cả mọi người cùng nhận thông tin một lúc — truyền thông toàn diện, kịp thời!',
  '🎯 Nice and Professional: Dùng lý trí, làm việc xuất sắc, không hời hợt mà vẫn duy trì tinh thần tích cực!',
  '⚖️ GS Phan Văn Trường: "Ai làm Sếp? Lợi ích tối đa công ty là Sếp!" — Đó là tinh thần bình đẳng, ai cũng phải tuân theo.',
  '📢 Công ty phát triển nhanh khi ai cũng biết chuyện xảy ra — cả tập thể đóng góp phiên bản tốt nhất cho khách hàng!',
  '🎯 Người vừa ôn hòa vừa chuyên nghiệp phát triển rất nhanh vì họ vừa giỏi vừa tạo nên môi trường tích cực!',
  '🤝 Tại TBS, mỗi phòng ban là một mắt xích quan trọng. Sự phối hợp chặt chẽ tạo nên sức mạnh tập thể!',
  '⭐ Chất lượng & Uy tín là nền tảng xây dựng niềm tin. TBS cam kết mang đến sản phẩm và dịch vụ tốt nhất!',
  '🏠 Senliving - thương hiệu nội thất & gia dụng của TBS, mang đến không gian sống đẹp cho gia đình Việt!',
  '🌍 Phòng XNK là cầu nối TBS với thế giới - đưa sản phẩm chất lượng quốc tế đến tay người tiêu dùng!',
  '❤️ Phòng CSKH TBS luôn lắng nghe và thấu hiểu - vì sự hài lòng của khách hàng là niềm vui của chúng ta!',
  '💪 Phòng Kinh Doanh TBS - những chiến binh tiên phong mở rộng thị trường và xây dựng đối tác bền vững!',
  '👥 Phòng Nhân Sự - trái tim của TBS, nơi chăm lo và phát triển tài sản quý giá nhất: Con Người!',
  '🏆 3 văn hóa hùng mạnh: Bình đẳng, Báo cáo kịp thời, Ôn hòa & Chuyên nghiệp — nền tảng phát triển TBS Group!',
  '⚖️ Lãnh đạo ân cần với nhân viên vì họ đi trên cùng một con thuyền, hướng về cùng một chiến lược chung!',
];

export function getRandomQuestions(count: number): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomCultureTip(): string {
  return CULTURE_TIPS[Math.floor(Math.random() * CULTURE_TIPS.length)];
}
