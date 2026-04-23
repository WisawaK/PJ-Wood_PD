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
        title: 'dashboard-Test',
        route: 'Chart',
      },
        {
   title: 'Calculate stock',
   route: 'Calculate-stock',
   icon: 'CircleIcon',
      },
  
  {
   title: 'Raw plan',
   route: 'Raw-Plan',
   icon: 'CircleIcon',
  },
  
  {
   title: 'Import submit product',
   route: 'Submit-product',
   icon: 'CircleIcon',
  },
{
   title: 'Check stock',
   route: 'Check-stock',
   icon: 'CircleIcon',
  },
  {
   title: 'GameOnlyAdmin',
   route: 'GameOnlyAdmin',
   icon: 'CircleIcon',
  }, 
 
    ],
  },

]
