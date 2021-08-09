'use strict';
const http = require('http');
const next = require('next');
const Server = require('socket.io');

let todos = [
  { id: 1, title: 'ネーム', completed: false },
  { id: 2, title: '下書き', completed: true },
];

// IDの値を管理するための変数
let id = 2;

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

nextApp.prepare().then(
  () => {
    // Next.jsのリクエストハンドラを引数にhttp.createServer()を実行
    const server = http.createServer(nextApp.getRequestHandler()).listen(3000);

    //サーバーインスタンス作成
    const io = Server(server);
    // /todos名前空間で接続待機
    const ioTodos = io.of('/todos');
    ioTodos.on('connection', (socket) => {
      //クライアントからの接続に伴うconnectionイベント( /todosに接続したら現在のTODO一覧を送信)
      console.log('connected');
      // 接続したクライアントにtodosというイベント名で、ToDo一覧を送信(socketインスタンスを介してクライアントと通信を行う)
      socket.emit('todos', todos);

      // 接続したクライアントからの各種イベントに対応(createTodoというイベント名でクライアントからデータ受信)
      socket
        // ToDo作成
        .on('createTodo', (title) => {
          if (typeof title !== 'string' || !title) {
            return;
          }
          const todo = { id: (id += 1), title, completed: false };
          todos.push(todo);
          //接続している全クライアントにtodosというイベント名でtodosデータを送信
          ioTodos.emit('todos', todos);
        })
        // ToDoのcompletedの更新
        .on('updateCompleted', (id, completed) => {
          todos = todos.map(
            //該当のIDのtodoならcompletedを更新する
            (todo) => (todo.id === id ? { ...todo, completed } : todo)
          );
          ioTodos.emit('todos', todos);
        })
        // ToDo削除
        .on('deleteTodo', (id) => {
          todos = todos.filter((todo) => todo.id !== id);
          ioTodos.emit('todos', todos);
        });
    });
  },
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
