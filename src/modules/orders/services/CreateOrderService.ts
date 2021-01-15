import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    if (!customer_id || !products) {
      throw new AppError('Invalid data for create a new order', 400);
    }

    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    let findedProducts = await this.productsRepository.findAllById(products.map(product => ({ id: product.id })));

    products.forEach(product => {
      const findedProduct = findedProducts.find(x => x.id === product.id);

      if (!findedProduct) {
        throw new AppError('Product not found');
      }

      if (product.quantity > findedProduct.quantity) {
        throw new AppError('Insufficient product', 400);
      }
    });

    const order = await this.ordersRepository.create({
      customer,
      products: findedProducts.map(product => ({
        product_id: product.id,
        price: product.price,
        quantity: products.find(x => x.id === product.id)?.quantity || 0
      }))
    });

    await this.productsRepository.updateQuantity(findedProducts.map(product => ({
      id: product.id,
      quantity: product.quantity - (products.find(x => x.id === product.id)?.quantity || 0)
    })));

    return order;
  }
}

export default CreateOrderService;
