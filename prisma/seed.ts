import { PrismaClient, Role, Country, PaymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.paymentMethod.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.restaurant.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const nickFury = await prisma.user.create({
    data: {
      name: 'Nick Fury',
      email: 'nickfury@shield.gov',
      passwordHash,
      role: Role.ADMIN,
      country: null,
    },
  });

  const captainMarvel = await prisma.user.create({
    data: {
      name: 'Captain Marvel',
      email: 'captainmarvel@shield.gov',
      passwordHash,
      role: Role.MANAGER,
      country: Country.INDIA,
    },
  });

  const captainAmerica = await prisma.user.create({
    data: {
      name: 'Captain America',
      email: 'captainamerica@shield.gov',
      passwordHash,
      role: Role.MANAGER,
      country: Country.AMERICA,
    },
  });

  const thanos = await prisma.user.create({
    data: {
      name: 'Thanos',
      email: 'thanos@shield.gov',
      passwordHash,
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  const thor = await prisma.user.create({
    data: {
      name: 'Thor',
      email: 'thor@shield.gov',
      passwordHash,
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  const travis = await prisma.user.create({
    data: {
      name: 'Travis',
      email: 'travis@shield.gov',
      passwordHash,
      role: Role.MEMBER,
      country: Country.AMERICA,
    },
  });

  // 2. Create PaymentMethods for Nick Fury
  await prisma.paymentMethod.create({
    data: {
      type: PaymentType.CARD,
      label: 'Visa ending 4242',
      isDefault: true,
      userId: nickFury.id,
    },
  });

  await prisma.paymentMethod.create({
    data: {
      type: PaymentType.UPI,
      label: 'nickfury@upi',
      isDefault: false,
      userId: nickFury.id,
    },
  });

  await prisma.paymentMethod.create({
    data: {
      type: PaymentType.WALLET,
      label: 'Amazon Pay',
      isDefault: false,
      userId: nickFury.id,
    },
  });

  // 3. Create Restaurants and Menu Items
  // INDIA
  await prisma.restaurant.create({
    data: {
      name: 'Spice Garden',
      description: 'Authentic Indian curries and tandoori.',
      imageUrl: 'https://images.unsplash.com/photo-1585938338392-50a59970d8ee',
      country: Country.INDIA,
      isActive: true,
      menuItems: {
        create: [
          { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', price: 280, imageUrl: 'https://example.com/paneer.jpg' },
          { name: 'Garlic Naan', description: 'Leavened flatbread with garlic', price: 70, imageUrl: 'https://example.com/naan.jpg' },
          { name: 'Chicken Biryani', description: 'Spiced fragrant rice with chicken', price: 320, imageUrl: 'https://example.com/biryani.jpg' },
          { name: 'Mango Lassi', description: 'Traditional sweet yogurt drink', price: 90, imageUrl: 'https://example.com/lassi.jpg' },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: 'Mumbai Bites',
      description: 'Street food and fast bites from Mumbai.',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78',
      country: Country.INDIA,
      isActive: true,
      menuItems: {
        create: [
          { name: 'Vada Pav', description: 'Spicy potato fritter in a bun', price: 60, imageUrl: 'https://example.com/vadapav.jpg' },
          { name: 'Pav Bhaji', description: 'Mashed vegetable curry with buns', price: 140, imageUrl: 'https://example.com/pavbhaji.jpg' },
          { name: 'Bhel Puri', description: 'Puffed rice savory snack', price: 80, imageUrl: 'https://example.com/bhelpuri.jpg' },
          { name: 'Cutting Chai', description: 'Strong cardamom milk tea', price: 30, imageUrl: 'https://example.com/chai.jpg' },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: 'Delhi Darbar',
      description: 'Royal Mughlai fine dining.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      country: Country.INDIA,
      isActive: true,
      menuItems: {
        create: [
          { name: 'Butter Chicken', description: 'Classic creamy tomato chicken curry', price: 350, imageUrl: 'https://example.com/butterchicken.jpg' },
          { name: 'Dal Makhani', description: 'Slow-cooked black lentils', price: 240, imageUrl: 'https://example.com/dal.jpg' },
          { name: 'Tandoori Roti', description: 'Whole wheat flatbread', price: 30, imageUrl: 'https://example.com/roti.jpg' },
          { name: 'Gulab Jamun', description: 'Sweet milk dumplings in syrup', price: 80, imageUrl: 'https://example.com/gulab.jpg' },
        ],
      },
    },
  });

  // AMERICA
  await prisma.restaurant.create({
    data: {
      name: 'Burger Palace',
      description: 'Juicy craft burgers and shakes.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      country: Country.AMERICA,
      isActive: true,
      menuItems: {
        create: [
          { name: 'Classic Cheeseburger', description: 'Beef patty, cheddar, lettuce, tomato', price: 9.99, imageUrl: 'https://example.com/burger.jpg' },
          { name: 'Bacon Double Burger', description: 'Two patties with crispy bacon', price: 12.99, imageUrl: 'https://example.com/double.jpg' },
          { name: 'Onion Rings', description: 'Crispy battered onion rings', price: 4.99, imageUrl: 'https://example.com/rings.jpg' },
          { name: 'Chocolate Shake', description: 'Thick whipped chocolate shake', price: 5.49, imageUrl: 'https://example.com/shake.jpg' },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: 'NY Pizza Co',
      description: 'Authentic NY style thin crust slices.',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
      country: Country.AMERICA,
      isActive: true,
      menuItems: {
        create: [
          { name: 'Pepperoni Slice', description: 'Classic pepperoni and mozzarella', price: 3.99, imageUrl: 'https://example.com/pepperoni.jpg' },
          { name: 'Cheese Pizza (Whole)', description: '18 inch cheese pizza pie', price: 18.99, imageUrl: 'https://example.com/wholepizza.jpg' },
          { name: 'Garlic Knots', description: '6 pieces with marinara dipping sauce', price: 5.99, imageUrl: 'https://example.com/knots.jpg' },
          { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, caesar dressing', price: 7.99, imageUrl: 'https://example.com/caesar.jpg' },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: 'Texas BBQ House',
      description: 'Wood-fired smoked brisket and ribs.',
      imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd',
      country: Country.AMERICA,
      isActive: true,
      menuItems: {
        create: [
          { name: 'Smoked Brisket Plate', description: 'Half pound brisket with two sides', price: 21.99, imageUrl: 'https://example.com/brisket.jpg' },
          { name: 'BBQ Ribs (Half Slab)', description: 'Tender baby back ribs', price: 18.99, imageUrl: 'https://example.com/ribs.jpg' },
          { name: 'Mac and Cheese', description: 'Creamy southern style mac', price: 4.49, imageUrl: 'https://example.com/mac.jpg' },
          { name: 'Sweet Peach Cobbler', description: 'Warm cobbler with vanilla ice cream', price: 6.99, imageUrl: 'https://example.com/cobbler.jpg' },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
