import '@styles/components/animated-logo.css';

export default function AnimatedLogo({
  src,
  alt = 'شعار المنصة',
  wrapperClassName = '',
  imgClassName = '',
}) {
  return (
    <span className={`nh-animated-logo ${wrapperClassName}`.trim()}>
      <span className="nh-animated-logo__glow" aria-hidden="true" />
      <span className="nh-animated-logo__beam" aria-hidden="true" />
      <span className="nh-animated-logo__reveal">
        <img src={src} alt={alt} className={imgClassName} />
      </span>
    </span>
  );
}
