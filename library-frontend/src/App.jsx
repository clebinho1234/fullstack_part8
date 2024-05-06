import { useState } from "react"
import Authors from "./components/Authors"
import Books from "./components/Books"
import NewBook from "./components/NewBook"
import LoginForm from "./components/LoginForm"
import Notify from "./components/Notify"
import { ALL_BOOKS, ALL_AUTHORS, ME, BOOK_ADDED } from "./queries"
import { useQuery, useApolloClient, useSubscription  } from '@apollo/client'
import RecommendedGenre from "./components/RecommendedGenre"

export const updateCache = (cache, query, addedBook) => {
  // helper that is used to eliminate saving same book twice
  const uniqByName = (a) => {
    let seen = new Set()
    return a.filter((item) => {
      let k = item.title
      return seen.has(k) ? false : seen.add(k)
    })
  }

  cache.updateQuery(query, ({ allBooks }) => {
    return {
      allBooks: uniqByName(allBooks.concat(addedBook)),
    }
  })
}

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('library-user-token'))
  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)
  const favoriteGenre = useQuery(ME)
  const [page, setPage] = useState("authors")
  const [errorMessage, setErrorMessage] = useState(null)
  const client = useApolloClient()

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  useSubscription(BOOK_ADDED, {
    onData: ({ data, client }) => {
      const addedBook = data.data.bookAdded
      notify(`${addedBook.title} added`)

      updateCache(client.cache, { query: ALL_BOOKS }, addedBook)
      books.refetch
    }
  })

  return (
    <div>
      <div>
          <button onClick={() => setPage("authors")}>authors</button>
          <button onClick={() => setPage("books")}>books</button>
          {!token 
          ? <button onClick={() => setPage("login")}>login</button>
          : <>
              <button onClick={() => setPage("add")}>add book</button>
              <button onClick={() => setPage("favGenre")}>recommend</button>
              <button onClick={() => logout()}>logout</button>
            </>
          }
        </div>
      <div>
        <Notify errorMessage={errorMessage} />

        <Authors 
          show={page === "authors"}
          authors={authors.data ? authors.data.allAuthors : []}
          setError={notify}
        />

        <Books 
          show={page === "books"}
          setError={notify}
        />

        <NewBook 
          show={page === "add"}
          setError={notify}
        />

        <RecommendedGenre 
          show={page === "favGenre"}
          books={books.data && favoriteGenre.data
                  ? books.data.allBooks.filter((book) => book.genres.includes(favoriteGenre.data.me.favoriteGenre)) 
                  : []}
          favGenre={favoriteGenre.data ? favoriteGenre.data.me.favoriteGenre :''}
        />

        <LoginForm 
          show={page === "login"}
          setToken={setToken}
          setPage={setPage}
        />

      </div>
    </div>
  )
}

export default App
