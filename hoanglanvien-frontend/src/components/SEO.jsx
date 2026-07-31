import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, url, image }) {
  const siteName = "Hoàng Lan Viên FarmStay";
  
  return (
    <Helmet>
      {/* Tiêu đề trang */}
      <title>{title ? `${title} | ${siteName}` : siteName}</title>
      
      {/* Mô tả cho Google Search */}
      <meta name="description" content={description || "Trải nghiệm kỳ nghỉ tuyệt vời tại Hoàng Lan Viên FarmStay."} />
      
      {/* Tối ưu khi Share link qua Zalo, Facebook (Open Graph) */}
      <meta property="og:title" content={title ? `${title} | ${siteName}` : siteName} />
      <meta property="og:description" content={description || "Trải nghiệm kỳ nghỉ tuyệt vời tại Hoàng Lan Viên FarmStay."} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
    </Helmet>
  );
}