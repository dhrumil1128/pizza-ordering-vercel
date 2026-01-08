import React, { useState, useEffect, useCallback } from 'react';

// --- Mock Data & API Simulation ---

const MOCK_PIZZAS = [
    { id: 1, name: "Margherita", description: "Classic tomato, mozzarella, and basil.", price: 12.50 },
    { id: 2, name: "Pepperoni Feast", description: "Loaded with spicy pepperoni.", price: 15.00 },
    { id: 3, name: "Veggie Supreme", description: "Mushrooms, onions, peppers, olives.", price: 14.50 },
    { id: 4, name: "Hawaiian Delight", description: "Ham and pineapple.", price: 16.00 },
];

// Simulate API call for fetching pizzas
const fetchPizzas = () => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (Math.random() < 0.1) { // 10% failure rate
            reject({ message: "Network error fetching menu." });
        } else {
            resolve(MOCK_PIZZAS);
        }
    }, 1000);
});

// Simulate API call for submitting order
const submitOrder = (orderData) => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (Math.random() < 0.15) { // 15% failure rate
            reject({ message: "Server rejected the order due to invalid data." });
        } else {
            resolve({ 
                orderId: `ORD-${Date.now()}`, 
                status: 'RECEIVED', 
                timestamp: new Date().toISOString() 
            });
        }
    }, 1500);
});


// --- Component Definitions ---

// 1. Header Component
const Header = () => (
    <header className="app-header">
        <h1>Pizza Planet</h1>
        <nav>
            <a href="#menu">Menu</a>
            <a href="#order">Order</a>
        </nav>
    </header>
);

// 2. PizzaCard Component
const PizzaCard = ({ pizza, onAddToCart }) => {
    return (
        <div className="pizza-card">
            <h3>{pizza.name}</h3>
            <p className="pizza-description">{pizza.description}</p>
            <p className="pizza-price">${pizza.price.toFixed(2)}</p>
            <button 
                className="add-to-cart-btn"
                onClick={() => onAddToCart(pizza)}
            >
                Add to Cart
            </button>
        </div>
    );
};

// 3. OrderSummary Component
const OrderSummary = ({ cart, updateQuantity, removeItem }) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cart.length === 0) {
        return <div className="order-summary empty-cart">Your cart is empty.</div>;
    }

    return (
        <div className="order-summary">
            <h2>Your Order</h2>
            <ul className="cart-items-list">
                {cart.map(item => (
                    <li key={item.id} className="cart-item">
                        <div className="item-details">
                            <strong>{item.name}</strong>
                            <p>${item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="item-controls">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                            <button className="remove-btn" onClick={() => removeItem(item.id)}>X</button>
                        </div>
                        <span className="line-total">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                ))}
            </ul>
            <div className="summary-footer">
                <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
            </div>
        </div>
    );
};

// 4. OrderForm Component
const OrderForm = ({ cart, onSubmit, isSubmitting, submissionError }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const canSubmit = cart.length > 0 && name.trim() !== '' && address.trim() !== '' && !isSubmitting;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (canSubmit) {
            onSubmit({ name, address, total });
        }
    };

    return (
        <div className="order-form-container">
            <h2>Checkout Details</h2>
            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="address">Delivery Address</label>
                    <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                
                <div className="total-display">
                    Total Payable: <strong>${total.toFixed(2)}</strong>
                </div>

                {submissionError && (
                    <p className="error-message submission-error">{submissionError}</p>
                )}

                <button 
                    type="submit" 
                    className="place-order-btn"
                    disabled={!canSubmit}
                >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
            </form>
        </div>
    );
};


// --- Main Application Component (App.jsx) ---

const App = () => {
    const [pizzas, setPizzas] = useState([]);
    const [cart, setCart] = useState([]); // [{ id, name, price, quantity }]
    const [isPizzaLoading, setIsPizzaLoading] = useState(true);
    const [pizzaError, setPizzaError] = useState(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [orderConfirmation, setOrderConfirmation] = useState(null); // { orderId, total }

    // 1. Load Pizzas
    useEffect(() => {
        const loadMenu = async () => {
            try {
                const data = await fetchPizzas();
                setPizzas(data);
            } catch (error) {
                console.error("Fetch Error:", error);
                setPizzaError("Failed to load pizza menu. Please try again later.");
            } finally {
                setIsPizzaLoading(false);
            }
        };
        loadMenu();
    }, []);

    // 2. Cart Management
    const handleAddToCart = useCallback((pizza) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === pizza.id);
            if (existingItem) {
                return prevCart.map(item => 
                    item.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...pizza, quantity: 1 }];
        });
        setSubmissionError(null); // Clear error on new addition
    }, []);

    const handleUpdateQuantity = useCallback((pizzaId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(pizzaId);
            return;
        }
        setCart(prevCart => 
            prevCart.map(item => 
                item.id === pizzaId ? { ...item, quantity: newQuantity } : item
            )
        );
    }, []);

    const handleRemoveItem = useCallback((pizzaId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== pizzaId));
    }, []);


    // 3. Order Submission
    const handleOrderSubmit = async ({ name, address, total }) => {
        if (cart.length === 0 || isSubmitting) return;

        setIsSubmitting(true);
        setSubmissionError(null);
        setOrderConfirmation(null);
        
        const orderPayload = {
            customerName: name,
            address: address,
            items: cart.map(item => ({
                pizzaId: item.id,
                quantity: item.quantity
            })),
            total: total
        };

        try {
            const response = await submitOrder(orderPayload);
            
            // Success handling (Step 8)
            setOrderConfirmation({
                orderId: response.orderId,
                timestamp: response.timestamp,
                total: total
            });
            setCart([]); // Clear cart
        } catch (error) {
            // Error handling (Step 7)
            console.error("Submission Error:", error);
            setSubmissionError(`Order submission failed: ${error.message || "Unknown Server Error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---

    if (orderConfirmation) {
        return (
            <div className="confirmation-screen">
                <Header />
                <div className="confirmation-box">
                    <h2>Order Received!</h2>
                    <p>Thank you for your order.</p>
                    <p>Your Order ID is: <strong>{orderConfirmation.orderId}</strong></p>
                    <p>Total Charged: <strong>${orderConfirmation.total.toFixed(2)}</strong></p>
                    <p>We are preparing your pizza now. Estimated delivery soon.</p>
                    <button onClick={() => setOrderConfirmation(null)}>Place Another Order</button>
                </div>
            </div>
        );
    }

    return (
        <div className="pizza-app-container">
            <Header />
            
            <main className="content-layout">
                
                {/* Menu Section */}
                <section id="menu" className="menu-section">
                    <h2>Our Menu</h2>
                    
                    {/* Loading State (Step 6) */}
                    {isPizzaLoading && <p className="loading-indicator">Loading menu...</p>}
                    
                    {/* Error State (Step 7) */}
                    {pizzaError && <p className="error-message menu-error">{pizzaError}</p>}

                    {/* Pizza Listing */}
                    {!isPizzaLoading && !pizzaError && (
                        <div className="pizza-list">
                            {pizzas.map(pizza => (
                                <PizzaCard 
                                    key={pizza.id} 
                                    pizza={pizza} 
                                    onAddToCart={handleAddToCart} 
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Order & Checkout Section */}
                <aside className="checkout-section">
                    <OrderSummary 
                        cart={cart} 
                        updateQuantity={handleUpdateQuantity}
                        removeItem={handleRemoveItem}
                    />
                    
                    <OrderForm 
                        cart={cart}
                        onSubmit={handleOrderSubmit}
                        isSubmitting={isSubmitting}
                        submissionError={submissionError}
                    />
                </aside>

            </main>
            
            {/* Embedded styles to simulate index.css functionality for a runnable single block */}
            <style>{`
                body { font-family: sans-serif; margin: 0; background-color: #f9f9f9; }
                .app-header {
                    background-color: #333;
                    color: white;
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .app-header h1 { margin: 0; font-size: 1.8rem; }
                .app-header nav a { color: white; margin-left: 15px; text-decoration: none; }
                
                .content-layout {
                    display: flex;
                    gap: 30px;
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .menu-section { flex: 3; }
                .checkout-section { flex: 1; min-width: 350px; }

                .pizza-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }
                .pizza-card {
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    background: white;
                }
                .add-to-cart-btn {
                    background-color: #e63946;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                    width: 100%;
                    transition: background-color 0.2s;
                }
                .add-to-cart-btn:hover { background-color: #c91e2b; }

                .order-summary {
                    border: 1px solid #ccc;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    background: white;
                }
                .cart-items-list { list-style: none; padding: 0; }
                .cart-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px dotted #eee;
                }
                .item-controls button {
                    width: 25px; height: 25px; border: 1px solid #ccc; background: #f4f4f4; cursor: pointer; margin: 0 2px;
                }
                .remove-btn {
                    background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; margin-left: 10px;
                }

                .order-form {
                    padding: 15px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    background: white;
                }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-group input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                
                .total-display {
                    font-size: 1.2rem;
                    margin: 15px 0;
                    text-align: right;
                }

                .place-order-btn {
                    background-color: #457b9d;
                    color: white;
                    border: none;
                    padding: 12px;
                    width: 100%;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1.1rem;
                    transition: background-color 0.2s;
                }
                .place-order-btn:disabled { background-color: #aaa; cursor: not-allowed; }

                .error-message {
                    padding: 10px;
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }
                .loading-indicator { font-style: italic; color: #666; padding: 10px; }

                .confirmation-screen { text-align: center; padding: 50px; }
                .confirmation-box { 
                    border: 2px solid #2a9d8f; 
                    padding: 30px; 
                    border-radius: 10px;
                    display: inline-block;
                    background: white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .confirmation-box button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background-color: #264653;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default App;
