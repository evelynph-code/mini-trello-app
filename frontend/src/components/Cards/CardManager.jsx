import { Plus } from 'lucide-react'
import { CardDetailsDialog, EditCardDialog } from './CardDialogs'
import { ListColumn } from './ListColumn'
import { normalizeListId } from './cardUtils'
import { useCardManager } from './useCardManager'

export function CardManager({
  currentUser,
  isAuthenticated,
  onBoardsChange,
  selectedBoard,
}) {
  const {
    cards,
    detailsCard,
    editingListId,
    error,
    form,
    handleChange,
    handleCreateCardInList,
    handleCreateList,
    handleDelete,
    handleDeleteList,
    handleEdit,
    handleEditSubmit,
    handleRenameList,
    handleReorderCard,
    handleReorderList,
    handleSaveCardOrder,
    handleSaveListOrder,
    handleStartCardOrder,
    handleToggleDetails,
    isEditing,
    isLoading,
    listForm,
    orderedCards,
    refreshTaskCount,
    resetForm,
    setDetailsCard,
    setEditingListId,
    setListForm,
  } = useCardManager({ isAuthenticated, onBoardsChange, selectedBoard })

  return (
    <section className="board-workspace" aria-labelledby="assigned-title">
      <div className="board-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 id="assigned-title">
            {selectedBoard ? selectedBoard.name : 'No board open'}
          </h2>
          {selectedBoard ? <p>{selectedBoard.description || 'Assignments live inside this board.'}</p> : null}
        </div>
        {isAuthenticated && selectedBoard ? (
          <div className="board-header-actions">
            <form className="list-create-form" onSubmit={handleCreateList}>
              <input
                aria-label="List name"
                placeholder="New list"
                value={listForm.name}
                onChange={(event) => setListForm({ name: event.target.value })}
              />
              <button type="submit">
                <Plus size={15} />
                Create list
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <p>Sign in with GitHub to list, create, edit, and delete assignments.</p>
      ) : !selectedBoard ? (
        <div className="empty-board-state">
          <h3>Create or open a board</h3>
          <p>Use the switch board bar above to choose a board or create a new one.</p>
        </div>
      ) : (
        <>
          {error ? <p className="inline-error">{error}</p> : null}
          <div className="assigned-list card-listing" aria-live="polite">
            {isLoading ? <p>Loading cards...</p> : null}
            {!isLoading && cards.length === 0 ? <p>No assignments in this board yet.</p> : null}
            <div className="list-board">
              {selectedBoard.lists.map((list, index) => (
                <ListColumn
                  key={list.id}
                  cards={orderedCards.filter((card) => normalizeListId(card.listId) === list.id)}
                  detailsCardId={detailsCard?.id}
                  editingListId={editingListId}
                  index={index}
                  list={list}
                  onCreateCard={handleCreateCardInList}
                  onDeleteList={handleDeleteList}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onRenameList={handleRenameList}
                  onStartEditList={setEditingListId}
                  onReorder={handleReorderCard}
                  onReorderList={handleReorderList}
                  onSaveOrder={handleSaveCardOrder}
                  onSaveListOrder={handleSaveListOrder}
                  onStartOrder={handleStartCardOrder}
                  onToggleDetails={handleToggleDetails}
                  selectedBoard={selectedBoard}
                />
              ))}
            </div>
          </div>

          {detailsCard ? (
            <CardDetailsDialog
              card={detailsCard}
              currentUser={currentUser}
              onClose={() => setDetailsCard(null)}
              onTasksChange={() => refreshTaskCount(detailsCard.id)}
              selectedBoard={selectedBoard}
            />
          ) : null}
          {isEditing ? (
            <EditCardDialog
              form={form}
              onChange={handleChange}
              onClose={resetForm}
              onSubmit={handleEditSubmit}
              selectedBoard={selectedBoard}
            />
          ) : null}
        </>
      )}
    </section>
  )
}
