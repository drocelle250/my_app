import { createContext, useReducer, useEffect } from 'react';

const InventoryContext = createContext();

const initialState = {
  products: [
    { id: 1, name: 'Laptop', categoryId: 1, quantity: 10, price: 999.99 },
    { id: 2, name: 'Mouse', categoryId: 2, quantity: 3, price: 24.99 }, // low
    { id: 3, name: 'Keyboard', categoryId: 2, quantity: 2, price: 59.99 }, // low
    { id: 4, name: 'Monitor', categoryId: 1, quantity: 5, price: 299.99 },
    { id: 5, name: 'Phone', categoryId: 3, quantity: 4, price: 699.99 }, // low
  ],
  categories: [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Accessories' },
    { id: 3, name: 'Mobile' },
  ],
  filter: '',
  sort: 'name' // name, quantity, price
};

function inventoryReducer(state, action) {
  switch (action.type) {
    case '@@INIT_STATE':
      return action.payload || state;
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'EDIT_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'ADD_CATEGORY':
      return { ...state, categories: [action.payload, ...state.categories] };
    case 'EDIT_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
        products: state.products.map(p => 
          p.categoryId === action.payload ? { ...p, categoryId: null } : p
        )
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    default:
      return state;
  }
}

export function InventoryProvider({ children }) {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem('inventoryState');
    if (saved) {
      const parsed = JSON.parse(saved);
      dispatch({ type: '@@INIT_STATE', payload: parsed });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('inventoryState', JSON.stringify(state));
  }, [state]);

  return (
    <InventoryContext.Provider value={{ state, dispatch }}>
      {children}
    </InventoryContext.Provider>
  );
}



