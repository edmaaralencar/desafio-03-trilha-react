import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) return JSON.parse(storagedCart);

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`/products/${productId}`);
      const product = cart.find((productItem) => productItem.id === productId);

      if (product) {
        updateProductAmount({ productId, amount: product.amount + 1 });
        return;
      }

      const updatedCart = [...cart, { ...data, amount: 1 }];

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter((cartItem) => cartItem.id !== productId);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`/stock/${productId}`);

      if (amount < 1) return;

      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora do estoque");
        return;
      }

      const updatedCart = cart.map((productItem) =>
        productItem.id === productId ? { ...productItem, amount } : productItem
      );

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
