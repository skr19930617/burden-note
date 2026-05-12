"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { useUserContext } from "./UserContext";

export function UserSwitcher() {
  const { users, meId, setMe, renameMe, createUser, loading } = useUserContext();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  if (loading) {
    return (
      <Typography variant="caption" color="text.secondary">
        読み込み中…
      </Typography>
    );
  }

  const me = users.find((u) => u.id === meId);

  return (
    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
      <Typography variant="caption" color="text.secondary">
        入力者
      </Typography>
      <Select
        size="small"
        value={meId ?? ""}
        onChange={(e) => setMe(String(e.target.value))}
        sx={{ minWidth: 92 }}
      >
        {users.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {u.name}
          </MenuItem>
        ))}
      </Select>

      {!editing && me && (
        <Tooltip title="名前を変える">
          <IconButton
            size="small"
            onClick={() => {
              setEditName(me.name);
              setEditing(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {editing && (
        <Stack
          component="form"
          direction="row"
          spacing={0.5}
          alignItems="center"
          onSubmit={async (e) => {
            e.preventDefault();
            if (editName.trim()) {
              await renameMe(editName.trim());
              setEditing(false);
            }
          }}
        >
          <TextField
            size="small"
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ width: 110 }}
          />
          <IconButton type="submit" size="small" color="primary">
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setEditing(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}

      {!adding ? (
        <Tooltip title="ユーザーを追加">
          <IconButton size="small" onClick={() => setAdding(true)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Stack
          component="form"
          direction="row"
          spacing={0.5}
          alignItems="center"
          onSubmit={async (e) => {
            e.preventDefault();
            if (newName.trim()) {
              const created = await createUser(newName.trim());
              setMe(created.id);
              setNewName("");
              setAdding(false);
            }
          }}
        >
          <TextField
            size="small"
            autoFocus
            placeholder="名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ width: 110 }}
          />
          <IconButton type="submit" size="small" color="primary">
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setAdding(false);
              setNewName("");
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
