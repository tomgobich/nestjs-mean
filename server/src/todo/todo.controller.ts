import { Controller, Post, HttpStatus, Get, Put, Delete, Param, Body, HttpException } from '@nestjs/common';
import { ApiUseTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Todo } from './models/todo.model';
import { TodoService } from './todo.service';
import { ApiException } from 'shared/api-exception.model';
import { GetOperationId } from 'shared/utilities/get-operation-id';
import { TodoVm } from './models/view-models/todo-vm.models';

@Controller('todos')
@ApiUseTags(Todo.modelName)
export class TodoController {
  constructor(private readonly _todoService: TodoService) {}

  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, type: TodoVm })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
  @ApiOperation(GetOperationId(Todo.modelName, 'Create'))
  async create(@Body() params: TodoParams): Promise<TodoVm> {
    const { content } = params;

    if (!content) {
      throw new HttpException('Content is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const newTodo = await this._todoService.createTodo(params);
      return this._todoService.map<TodoVm>(newTodo);
    } catch (error) {}
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: TodoVm, isArray: true })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
  @ApiOperation(GetOperationId(Todo.modelName, 'GetAll'))
  async get(): Promise<TodoVm[]> {
    try {
      const todos = await this._todoService.findAll();
      return this._todoService.map<TodoVm[]>(todos.map((todo) => todo.toJSON()), true);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put()
  @ApiResponse({ status: HttpStatus.CREATED, type: TodoVm })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
  @ApiOperation(GetOperationId(Todo.modelName, 'Update'))
  async update(@Body() vm: TodoVM): Promise<TodoVm> {
    const { id, content, level, isCompleted } = vm;

    if (!vm || !id) {
      throw new HttpException('Missing parameters', HttpStatus.BAD_REQUEST);
    }

    const exist = await this._todoService.findById(id);

    if (!exist) {
      throw new HttpException(`${id} not found`, HttpStatus.NOT_FOUND);
    }

    if (exist.isCompleted) {
      throw new HttpException('Already completed', HttpStatus.BAD_REQUEST);
    }

    exist.content = content;
    exist.isCompleted = isCompleted;
    exist.level = level;

    try {
      const updated = await this._todoService.update(id, exist);
      return this._todoService.map<TodoVm>(updated.toJSON());
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TodoVm })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
  @ApiOperation(GetOperationId(Todo.modelName, 'Delete'))
  async delete(@Param('id') id: string): Promise<TodoVm> {
    try {
      const deleted = await this._todoService.delete(id);
      return this._todoService.map<TodoVm>(deleted.toJSON());
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
