import './App.css'
import BookingMaker from './Components/BookingMaker'

function App() {

  function handlePageRefreash(){
    window.location.reload()
  }

  return (
    <>
      <BookingMaker refreash={handlePageRefreash}/>
    </>
  )
}

export default App
