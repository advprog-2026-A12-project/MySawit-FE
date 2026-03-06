interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
}

const dummyUsers: User[] = [
  { id: 1, username: "admin01", email: "admin@mysawit.com", name: "Admin Utama", role: "ADMIN" },
  { id: 2, username: "petani01", email: "budi@email.com", name: "Budi Santoso", role: "PETANI" },
  { id: 3, username: "petani02", email: "siti@email.com", name: "Siti Aminah", role: "PETANI" },
  { id: 4, username: "manajer01", email: "andi@email.com", name: "Andi Wijaya", role: "MANAJER" },
  { id: 5, username: "petani03", email: "rina@email.com", name: "Rina Marlina", role: "PETANI" },
];

export default function UserPage() {
  const users = dummyUsers;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Manajemen User</h1>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-700">Live Data User</h2>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">
                    {user.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {user.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center italic text-gray-500">
                    Belum ada data user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
