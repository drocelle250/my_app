import React, { useEffect, useState } from "react";
import API from "../api";

const Products = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get("/products")
      .then((res) => {
        console.log(res.data);
        setProducts(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div>
      <h2>Products</h2>

      {products.map((p) => (
        <div key={p.id}>
          {p.name} - ${p.price}
        </div>
      ))}
    </div>
  );
};

export default Products;