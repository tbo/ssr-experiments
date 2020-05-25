const ProductTile = ({ id, name, price, description, image }: any) => (
  <div id={id} className="card blue-grey darken-1 hit">
    <div className="card-content white-text">
      <span className="card-title">{name}</span>
    </div>
    <div className="image-wrapper">
      <image loading="lazy" src={image} />
    </div>
    <div className="card-content white-text">
      {price} Euro
      <br />
      {description}
    </div>
  </div>
);

export default ProductTile;
