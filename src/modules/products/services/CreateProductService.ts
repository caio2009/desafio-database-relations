import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository
  ) { }

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    if (!name || !price || !quantity) {
      throw new AppError('Invalid data for create a new product');
    }

    const productExists = await this.productsRepository.findByName(name);

    if (productExists) {
      throw new AppError('Product with same name already exists', 400);
    }

    const product = await this.productsRepository.create({ name, price, quantity });

    return product;
  }
}

export default CreateProductService;
