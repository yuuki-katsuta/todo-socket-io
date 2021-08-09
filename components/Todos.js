import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import io from 'socket.io-client';

// 各ページに関する情報の定義
const pages = {
  index: { title: 'すべてのToDo' },
  active: { title: '未完了のToDo', completed: false },
  completed: { title: '完了したToDo', completed: true },
};
// CSRでページを切り替えるためのリンク
const pageLinks = Object.keys(pages).map((page, index) => (
  <Link href={`/${page === 'index' ? '' : page}`} key={index}>
    <a style={{ marginRight: 10 }}>{pages[page].title}</a>
  </Link>
));

const Todos = (props) => {
  const { title, completed } = pages[props.page];
  const [todos, setTodos] = useState([]);

  // socketをstateとして保持
  const [socket, setSocket] = useState();

  useEffect(() => {
    // 名前空間を指定してsocketインスタンスの生成
    const socket = io('/todos');
    //サーバーからtodosイベントを受け取り、pageごとにフィルタリングを行う
    socket.on('todos', (todos) => {
      setTodos(
        typeof completed === 'undefined'
          ? todos
          : todos.filter((todo) => todo.completed === completed)
      );
    });
    //useEffect外でもつかうためstateとして保持する
    setSocket(socket);
    // コンポーネントのクリーンアップ時にsocketをクローズ
    return () => socket.close();
  }, [props.page]);

  // JSX
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <h1>{title}</h1>
      <label>
        新しいTodoを入力
        <input
          onKeyPress={(e) => {
            // Enterキーが押されたらToDoを登録する
            const title = e.target.value;
            if (e.key !== 'Enter' || !title) {
              return;
            }
            e.target.value = '';
            socket.emit('createTodo', title);
            //イベント発生→サーバーでcreateTodoイベント発生してtodoの状態が変更される
          }}
        />
      </label>
      {/* ToDo一覧 */}
      <ul>
        {todos.map(({ id, title, completed }) => (
          <li key={id}>
            <label style={completed ? { textDecoration: 'line-through' } : {}}>
              <input
                type='checkbox'
                checked={completed}
                onChange={(e) =>
                  socket.emit('updateCompleted', id, e.target.checked)
                }
              />
              {title}
            </label>
            <button onClick={() => socket.emit('deleteTodo', id)}>削除</button>
          </li>
        ))}
      </ul>
      <div>{pageLinks}</div>
    </>
  );
};
export default Todos;
