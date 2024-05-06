import { useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client'
import { ALL_BOOKS, BOOK_ADDED } from '../queries'
import { updateCache } from '../App'
import PropTypes from 'prop-types'

const Books = ({ show, setError }) => {
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [allGenres, setAllGenres] = useState([])
  const books = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre }
  })

  useSubscription(BOOK_ADDED, {
    onData: ({ data, client }) => {
      const addedBook = data.data.bookAdded

      updateCache(client.cache, { query: ALL_BOOKS }, addedBook)
      books.refetch()
    }
  })

  if(books.loading)
    return <p>...loading</p>

  if(books.error)
    return setError(books.error)


  if (books.data) {
    books.data.allBooks.forEach((book) => {
      book.genres.forEach((genre) => {
        if (!allGenres.includes(genre)) {
          setAllGenres(allGenres.concat(genre))
        }
      })
    })
  }

  if (!show) {
    return null;
  }

  return (
    <div>
      <h2>books</h2>
      <p>in genre <b>{selectedGenre ? selectedGenre : 'all'}</b> </p>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.data.allBooks.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {allGenres.map((genre) => (
            <button key={genre} onClick={() => setSelectedGenre(genre)}> {genre} </button>
        ))}
        <button onClick={() => setSelectedGenre(null)}> all genres </button>
      </div>
    </div>
  );
};

Books.propTypes = {
  show: PropTypes.bool.isRequired,
  setError: PropTypes.func.isRequired
}

export default Books
