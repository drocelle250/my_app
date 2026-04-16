import React from 'react'

const Task1 = () => {
  return (
    <div className=' p-9 '>
      {/* HEADER */}
      <header className='bg-blue-500 mt-2 p-4 font-bold text-white text-2xl flex justify-between items-center rounded-xl'>
        <h1>🍸 Students Profiles</h1>

        <button className='bg-white text-black px-4 py-1 rounded-md text-base'>
          + Add Student
        </button>
      </header>

      {/* SEARCH */}
      <div className='p-4'>
        <input
          type='search'
          placeholder='🔍 Search by name...'
          className='rounded-full px-4 py-2 w-full max-w-md border'
        />
      </div>

      {/* STUDENT CARDS */}
      <div className='p-4 grid grid-cols-4 gap-4'>

        {/* CARD 1 */}
        <div className='bg-white shadow-lg rounded-2xl p-4 text-center'>
          <div className='w-16 h-16 mx-auto mb-2 rounded-full bg-fuchsia-200 flex items-center justify-center text-2xl font-bold'>
            A
          </div>
          <p className='text-xl font-semibold'>Alice</p>
          <p>Computer Sci</p>
          <p>Age: 19</p>
          <button className='bg-red-200 rounded px-2 mt-2'>Remove</button>
        </div>

        {/* CARD 2 */}
        <div className='bg-white shadow-md rounded-2xl p-4 text-center hover:shadow-lg transition'>
          <div className='w-16 h-16 mx-auto mb-2 bg-green-100 rounded-full text-green-600 text-2xl flex items-center justify-center font-bold'>
            B
          </div>
          <p className='text-xl font-semibold'>Bob K</p>
          <p>Electronic</p>
          <p>Age: 20</p>
          <button className='bg-red-200 rounded px-2 mt-2'>Remove</button>
        </div>

        <div className='bg-white shadow-md rounded-2xl p-4 text-center'>
          <div className='w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-full text-blue-600 text-2xl flex items-center justify-center font-bold'>
            C
          </div>
          <p className='text-xl font-semibold'>Chris</p>
          <p>Electronic</p>
          <p>Age: 20</p>
          <button className='bg-red-200 rounded px-2 mt-2'>Remove</button>
        </div>

        {/* ADD CARD */}
        <div className='bg-white shadow-md rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer'>
          <div className='w-16 h-16 mb-3  flex items-center justify-center text-3xl font-bold text-blue-500'>
            +
          </div>
          <p className='text-blue-800'>Add Student</p>
        </div>

      </div>
    </div>
  )
}

export default Task1