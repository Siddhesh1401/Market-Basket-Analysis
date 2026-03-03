export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
}

export const products: Product[] = [
  { id: 1, name: "Whole Milk", price: 0.99, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop", category: "Beverages", rating: 4.5, reviews: 234, description: "Fresh whole milk, 2 litres. Perfect for everyday use." },
  { id: 2, name: "White Bread", price: 1.20, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop", category: "Food", rating: 4.3, reviews: 189, description: "Soft white bread loaf, freshly baked." },
  { id: 3, name: "Free Range Eggs", price: 2.50, image: "https://images.unsplash.com/photo-1607690424560-35d967d6ad7e?w=300&h=300&fit=crop", category: "Food", rating: 4.7, reviews: 312, description: "12 free range eggs from local farms." },
  { id: 4, name: "Unsalted Butter", price: 1.80, image: "https://images.unsplash.com/photo-1589985270826-4cbacc25df17?w=300&h=300&fit=crop", category: "Food", rating: 4.4, reviews: 156, description: "Pure unsalted butter, 250g block." },
  { id: 5, name: "Cheddar Cheese", price: 3.20, image: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=300&h=300&fit=crop", category: "Food", rating: 4.6, reviews: 278, description: "Mature cheddar cheese, 400g. Rich and flavourful." },
  { id: 6, name: "Strawberry Jam", price: 2.10, image: "https://images.unsplash.com/photo-1597528374869-f71a2e9f4c5b?w=300&h=300&fit=crop", category: "Food", rating: 4.2, reviews: 145, description: "Homestyle strawberry jam, 340g jar." },
  { id: 7, name: "Orange Juice", price: 1.75, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop", category: "Beverages", rating: 4.5, reviews: 201, description: "100% pure squeezed orange juice, 1 litre." },
  { id: 8, name: "Bacon Rashers", price: 3.50, image: "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=300&h=300&fit=crop", category: "Food", rating: 4.8, reviews: 389, description: "Smoked back bacon rashers, 300g pack." },
  { id: 9, name: "Greek Yoghurt", price: 1.60, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop", category: "Food", rating: 4.4, reviews: 167, description: "Thick and creamy Greek yoghurt, 500g." },
  { id: 10, name: "Olive Oil", price: 4.99, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop", category: "Household", rating: 4.6, reviews: 223, description: "Extra virgin olive oil, cold pressed, 500ml." },
  { id: 11, name: "Cornflakes", price: 2.40, image: "https://images.unsplash.com/photo-1638176073-3ea8534d30a8?w=300&h=300&fit=crop", category: "Snacks", rating: 4.1, reviews: 134, description: "Classic cornflakes breakfast cereal, 500g." },
  { id: 12, name: "Pasta (Penne)", price: 1.10, image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop", category: "Food", rating: 4.3, reviews: 198, description: "Dried penne pasta, 500g. Ready in 11 minutes." },
  { id: 13, name: "Tomato Sauce", price: 1.50, image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=300&h=300&fit=crop", category: "Food", rating: 4.2, reviews: 176, description: "Rich Italian tomato pasta sauce, 500g jar." },
  { id: 14, name: "Sparkling Water", price: 0.75, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop", category: "Beverages", rating: 4.0, reviews: 112, description: "Refreshing sparkling water, 1.5 litre bottle." },
  { id: 15, name: "Washing Up Liquid", price: 1.30, image: "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=300&h=300&fit=crop", category: "Household", rating: 4.3, reviews: 145, description: "Lemon fresh washing up liquid, 500ml." },
  { id: 16, name: "Chocolate Biscuits", price: 1.90, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop", category: "Snacks", rating: 4.7, reviews: 356, description: "Milk chocolate digestive biscuits, 300g pack." },
  { id: 17, name: "Chicken Breast", price: 5.50, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop", category: "Food", rating: 4.5, reviews: 267, description: "Boneless skinless chicken breast fillets, 600g." },
  { id: 18, name: "Brown Rice", price: 2.20, image: "https://images.unsplash.com/photo-1536304993881-ff86e0c9d590?w=300&h=300&fit=crop", category: "Food", rating: 4.2, reviews: 143, description: "Wholegrain brown rice, 1kg bag." },
  { id: 19, name: "Instant Coffee", price: 3.80, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop", category: "Beverages", rating: 4.4, reviews: 289, description: "Rich instant coffee granules, 200g jar." },
  { id: 20, name: "Hand Soap", price: 1.45, image: "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=300&h=300&fit=crop", category: "Household", rating: 4.1, reviews: 98, description: "Moisturising antibacterial hand soap, 300ml." },
];

export const categories = ["All", "Food", "Beverages", "Snacks", "Household"];
