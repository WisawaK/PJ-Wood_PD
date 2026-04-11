export default [
  {
    title: 'Home',
    route: 'home',
    icon: 'HomeIcon',
  },
  {
  title: 'Dashborad',
  route: 'Dashborad',
  icon: 'CircleIcon',
  },
  {
    header: 'PRODUCT', 
  },
  {
    title: 'PD-Product',           // หัวข้อหลักที่มีลูกศร
    icon: 'PackageIcon',        // ไอคอนหน้าชื่อ (เช่นรูปกล่อง)
    children: [                 // ใส่เมนูย่อยใน Array นี้
      {
        title: '01',
        route: 'test',
      },
      {
        title: '02',
        route: 'inbound-page',
      },
    ],
  },

]
