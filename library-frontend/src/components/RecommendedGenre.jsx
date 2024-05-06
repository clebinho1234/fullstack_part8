import PropTypes from 'prop-types'

const RecommendGenre = ({ show, books, favGenre }) => {
  if (!show) {
    return null
  }

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre <b>{favGenre}</b> </p>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

RecommendGenre.propTypes = {
  show: PropTypes.bool.isRequired,
  books: PropTypes.array.isRequired,
  favGenre: PropTypes.string.isRequired
}

export default RecommendGenre
